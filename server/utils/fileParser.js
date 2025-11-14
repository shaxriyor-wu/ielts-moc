import fs from 'fs';
import path from 'path';

export const parseTextFile = async (filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return {
      text: content,
      questions: extractQuestions(content),
      passages: extractPassages(content)
    };
  } catch (error) {
    throw new Error('Failed to parse text file');
  }
};

export const parsePDF = async (filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return {
      text: content,
      questions: extractQuestions(content),
      passages: extractPassages(content)
    };
  } catch (error) {
    throw new Error('Failed to parse PDF file');
  }
};

const extractQuestions = (text) => {
  const questions = [];
  const questionRegex = /(?:Question\s*(\d+)|Q\s*(\d+)|(\d+)\.)\s*(.+?)(?=(?:Question\s*\d+|Q\s*\d+|\d+\.)|$)/gis;
  let match;
  
  while ((match = questionRegex.exec(text)) !== null) {
    const questionNum = match[1] || match[2] || match[3];
    const questionText = match[4].trim();
    questions.push({
      id: questionNum,
      question: questionText,
      type: 'multiple-choice'
    });
  }
  
  return questions;
};

const extractPassages = (text) => {
  const passages = [];
  const passageRegex = /(?:Passage|Reading|Text)\s*(?:\d+)?\s*:?\s*(.+?)(?=(?:Passage|Reading|Text|Question|Q|\d+\.)|$)/gis;
  let match;
  
  while ((match = passageRegex.exec(text)) !== null) {
    passages.push(match[1].trim());
  }
  
  return passages.length > 0 ? passages : [text];
};

export const parseListeningFile = async (filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return {
      text: content,
      questions: extractQuestions(content),
      sections: extractListeningSections(content)
    };
  } catch (error) {
    throw new Error('Failed to parse listening file');
  }
};

const extractListeningSections = (text) => {
  const sections = [];
  const sectionRegex = /(?:Section|Part)\s*(\d+)\s*:?\s*(.+?)(?=(?:Section|Part)\s*\d+|$)/gis;
  let match;
  
  while ((match = sectionRegex.exec(text)) !== null) {
    sections.push({
      section: match[1],
      content: match[2].trim()
    });
  }
  
  return sections.length > 0 ? sections : [{ section: '1', content: text }];
};

