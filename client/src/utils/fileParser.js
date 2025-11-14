import * as XLSX from 'xlsx';
import Papa from 'papaparse';

export const parseJSON = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        resolve(data);
      } catch (error) {
        reject(new Error('Invalid JSON format'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};

export const parseXLSX = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        const questions = jsonData.map((row, index) => ({
          id: index + 1,
          question: row.question || row.Question || row['Savol'] || '',
          options: [
            row.optionA || row['A'] || row['Variant A'] || '',
            row.optionB || row['B'] || row['Variant B'] || '',
            row.optionC || row['C'] || row['Variant C'] || '',
            row.optionD || row['D'] || row['Variant D'] || '',
          ].filter(Boolean),
          answer: row.answer || row.Answer || row['Javob'] || 0,
        }));

        resolve({ title: sheetName, questions });
      } catch (error) {
        reject(new Error('Failed to parse XLSX file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
};

export const parseCSV = (file) => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      complete: (results) => {
        try {
          const questions = results.data.map((row, index) => ({
            id: index + 1,
            question: row.question || row.Question || '',
            options: [
              row.optionA || row['A'] || '',
              row.optionB || row['B'] || '',
              row.optionC || row['C'] || '',
              row.optionD || row['D'] || '',
            ].filter(Boolean),
            answer: parseInt(row.answer || row.Answer || 0),
          }));
          resolve({ title: 'Imported Test', questions });
        } catch (error) {
          reject(new Error('Failed to parse CSV file'));
        }
      },
      error: (error) => reject(error),
    });
  });
};

export const parseTextFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim());
      resolve({ text, paragraphs });
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};

