require("dotenv").config();
const connectDB = require("../config/database");
const Movie = require("../models/Movie");
const { MOVIES, SERIES } = require("../data/seedMovies");

async function run() {
  await connectDB();

  await Movie.deleteMany({});
  const inserted = await Movie.insertMany([...MOVIES, ...SERIES]);

  console.log(`Seeded ${inserted.length} titles (${MOVIES.length} movies, ${SERIES.length} series).`);
  process.exit(0);
}

run().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
