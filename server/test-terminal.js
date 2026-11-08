import dotenv from "dotenv";
dotenv.config();

import connectDB from "./config/db.js";
import mongoose from "mongoose";
import {
  generateSummary,
  generateFlashcards,
  generateQuiz,
} from "./services/aiService.js";

async function main() {
  console.log("==========================================");
  console.log("   AI Study Buddy - Terminal Output Test   ");
  console.log("==========================================\n");

  // 1. Test Database
  console.log("[1/4] Checking MongoDB Connection...");
  try {
    await connectDB();
    console.log("✓ MongoDB is successfully connected!\n");
  } catch (err) {
    console.error("✗ Database connection failed:", err.message, "\n");
  }

  const sampleStudyText =
    "Photosynthesis is the process used by plants and other organisms to convert light energy into chemical energy that, through cellular respiration, can later be released to fuel the organism's activities. Some of this chemical energy is stored in carbohydrate molecules, such as sugars and starches, which are synthesized from carbon dioxide and water. In most cases, oxygen is also released as a waste product. Most plants, algae, and cyanobacteria perform photosynthesis; such organisms are called photoautotrophs.";

  console.log("Input Study Text:");
  console.log(`"${sampleStudyText}"\n`);

  // 2. Test Summary
  console.log("[2/4] Generating AI Summary...");
  try {
    const summaryResult = await generateSummary(sampleStudyText);
    console.log("✓ AI Summary generated successfully:");
    console.log(`Summary: ${summaryResult.summary}`);
    console.log("Key Points:");
    summaryResult.keyPoints.forEach((pt, i) =>
      console.log(`  ${i + 1}. ${pt}`)
    );
    console.log();
  } catch (err) {
    console.error("✗ AI Summary generation failed:", err.message, "\n");
  }

  // 3. Test Flashcards
  console.log("[3/4] Generating AI Flashcards...");
  try {
    const flashcards = await generateFlashcards(sampleStudyText, 3);
    console.log(`✓ AI Flashcards generated (${flashcards.length} cards):`);
    flashcards.forEach((card, i) => {
      console.log(`  Card ${i + 1} [${card.difficulty.toUpperCase()}]:`);
      console.log(`    Q: ${card.question}`);
      console.log(`    A: ${card.answer}`);
    });
    console.log();
  } catch (err) {
    console.error("✗ AI Flashcard generation failed:", err.message, "\n");
  }

  // 4. Test Quiz
  console.log("[4/4] Generating AI Quiz (Multiple Choice)...");
  try {
    const quiz = await generateQuiz(sampleStudyText, 2, "mcq");
    console.log(`✓ AI Quiz generated (${quiz.length} questions):`);
    quiz.forEach((q, i) => {
      console.log(`  Question ${i + 1}: ${q.question}`);
      q.options.forEach((opt, idx) => console.log(`    [${idx + 1}] ${opt}`));
      console.log(`    Correct Answer: ${q.correctAnswer}`);
      console.log(`    Explanation: ${q.explanation}`);
    });
    console.log();
  } catch (err) {
    console.error("✗ AI Quiz generation failed:", err.message, "\n");
  }

  console.log("==========================================");
  console.log("   All tests completed successfully!      ");
  console.log("==========================================");

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
