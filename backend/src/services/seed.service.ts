import { Station } from '../models/Station';
import { Coach } from '../models/Coach';
import { Seat } from '../models/Seat';
import { Train } from '../models/Train';
import { Booking } from '../models/Booking';
import { CoachClass } from '../types';

export const seedDatabase = async (): Promise<{ message: string; stationsCount: number; coachesCount: number; seatsCount: number; trainsCount: number }> => {
  // Clear existing collections
  await Booking.deleteMany({});
  await Train.deleteMany({});
  await Seat.deleteMany({});
  await Coach.deleteMany({});
  await Station.deleteMany({});

  // 1. Seed Colombo Fort - Badulla Main Line Stations with actual distances (km)
  const stationData = [
    { name: 'Colombo Fort', code: 'FOT', sequence: 0, distanceFromOriginKm: 0 },
    { name: 'Ragama', code: 'RGM', sequence: 1, distanceFromOriginKm: 16 },
    { name: 'Gampaha', code: 'GPH', sequence: 2, distanceFromOriginKm: 28 },
    { name: 'Polgahawela', code: 'PLW', sequence: 3, distanceFromOriginKm: 73 },
    { name: 'Kurunegala', code: 'KRN', sequence: 4, distanceFromOriginKm: 94 },
    { name: 'Peradeniya', code: 'PDA', sequence: 5, distanceFromOriginKm: 115 },
    { name: 'Kandy', code: 'KDY', sequence: 6, distanceFromOriginKm: 120 },
    { name: 'Nawalapitiya', code: 'NVP', sequence: 7, distanceFromOriginKm: 140 },
    { name: 'Hatton', code: 'HTN', sequence: 8, distanceFromOriginKm: 175 },
    { name: 'Nanu Oya (Nuwara Eliya)', code: 'NOA', sequence: 9, distanceFromOriginKm: 206 },
    { name: 'Pattipola', code: 'PTP', sequence: 10, distanceFromOriginKm: 224 },
    { name: 'Ella', code: 'ELA', sequence: 11, distanceFromOriginKm: 271 },
    { name: 'Badulla', code: 'BAD', sequence: 12, distanceFromOriginKm: 292 },
  ];

  const stations = await Station.insertMany(stationData);

  // 2. Seed Coaches
  const coachData = [
    { name: 'Coach A - 1st Class Observation', classType: CoachClass.FIRST, totalSeats: 20, layoutRows: 5, layoutCols: 4 },
    { name: 'Coach B - 2nd Class Reserved', classType: CoachClass.SECOND, totalSeats: 24, layoutRows: 6, layoutCols: 4 },
    { name: 'Coach C - 3rd Class Reserved', classType: CoachClass.THIRD, totalSeats: 28, layoutRows: 7, layoutCols: 4 },
  ];

  const coaches = await Coach.insertMany(coachData);

  // 3. Seed Seats for each Coach
  const seatsToInsert = [];
  const colLetters = ['A', 'B', 'C', 'D'];

  for (const coach of coaches) {
    for (let r = 1; r <= coach.layoutRows; r++) {
      for (let c = 1; c <= coach.layoutCols; c++) {
        const seatNum = `${r}${colLetters[c - 1]}`;
        seatsToInsert.push({
          coachId: coach._id,
          seatNumber: seatNum,
          row: r,
          column: c,
        });
      }
    }
  }

  const seats = await Seat.insertMany(seatsToInsert);

  // 4. Seed Train Schedule (Podi Menike - Colombo Fort to Badulla)
  const stationRoute = stations.map((st) => ({
    stationId: st._id,
    name: st.name,
    code: st.code,
    sequence: st.sequence,
    distanceFromOriginKm: st.distanceFromOriginKm,
    arrivalTime: st.sequence === 0 ? '05:55 AM' : `${6 + Math.floor(st.sequence * 0.7)}:${(st.sequence * 20) % 60}0 AM`,
    departureTime: st.sequence === 12 ? '04:30 PM' : `${6 + Math.floor(st.sequence * 0.7)}:${((st.sequence * 20) % 60) + 5}0 AM`,
  }));

  const trainData = [
    {
      trainNumber: '1005 - Podi Menike',
      name: 'Colombo Fort - Badulla Express',
      stations: stationRoute,
    },
    {
      trainNumber: '1015 - Denuwara Menike',
      name: 'Colombo Fort - Badulla AC Intercity',
      stations: stationRoute,
    },
  ];

  const trains = await Train.insertMany(trainData);

  return {
    message: 'Database seeded successfully with Colombo Fort - Badulla Railway data!',
    stationsCount: stations.length,
    coachesCount: coaches.length,
    seatsCount: seats.length,
    trainsCount: trains.length,
  };
};
