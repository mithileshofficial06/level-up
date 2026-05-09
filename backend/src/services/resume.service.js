import { parsePDF } from '../utils/pdfParser.js';
import { extractResumeData } from './claude.service.js';
import supabase from '../db.js';

/**
 * Parse a resume PDF buffer and extract structured data
 * @param {Buffer} buffer - PDF file buffer
 * @param {string} userId - User's database ID
 * @returns {Object} Parsed and structured resume data
 */
export const parseAndSaveResume = async (buffer, userId) => {
  // Step 1: Extract raw text from PDF
  console.log('📄 Extracting text from PDF...');
  const rawText = await parsePDF(buffer);

  if (!rawText || rawText.trim().length < 50) {
    throw new Error('Could not extract meaningful text from PDF. Please ensure the PDF is not image-based.');
  }

  // Step 2: Send to Claude for structured extraction
  console.log('🤖 Sending to Claude for structured extraction...');
  const structuredData = await extractResumeData(rawText);

  // Step 3: Save to Supabase
  if (supabase) {
    console.log('💾 Saving resume to database...');

    // Check for existing resume
    const { data: existing } = await supabase
      .from('resumes')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (existing) {
      // Update existing resume
      const { error } = await supabase
        .from('resumes')
        .update({
          parsed_text: rawText,
          structured_data: structuredData,
        })
        .eq('id', existing.id);

      if (error) throw new Error(`Failed to update resume: ${error.message}`);
    } else {
      // Insert new resume
      const { error } = await supabase
        .from('resumes')
        .insert({
          user_id: userId,
          parsed_text: rawText,
          structured_data: structuredData,
        });

      if (error) throw new Error(`Failed to save resume: ${error.message}`);
    }
  }

  return {
    rawText: rawText.substring(0, 500) + '...', // Preview only
    structuredData,
  };
};

export default { parseAndSaveResume };
