import Note from "../models/Note.js";
import ApiError from "./ApiError.js";

// Finds a note that belongs to the user, or throws 404
export default async function findOwnedNote(id, userId, withText = false) {
  const query = Note.findOne({ _id: id, userId });
  if (withText) query.select("+extractedText");
  const note = await query;
  if (!note) throw new ApiError(404, "Note not found");
  return note;
}
