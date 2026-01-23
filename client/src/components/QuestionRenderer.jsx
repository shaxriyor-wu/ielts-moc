import React from 'react';
import IELTSHighlightableText from './IELTSHighlightableText';

const QuestionTextHighlighter = ({ text, contextId, highlights, onHighlight, className = '' }) => {
    if (!onHighlight) return <span className={className} dangerouslySetInnerHTML={{ __html: text }} />;

    const localHighlights = (highlights || []).filter(h => h.contextId === contextId);

    const handleLocalHighlight = (newLocalHighlights) => {
        const otherHighlights = (highlights || []).filter(h => h.contextId !== contextId);
        const taggedHighlights = newLocalHighlights.map(h => ({ ...h, contextId }));
        onHighlight([...otherHighlights, ...taggedHighlights]);
    };

    return (
        <IELTSHighlightableText
            content={text}
            highlights={localHighlights}
            onHighlight={handleLocalHighlight}
            className={`inline-block ${className}`}
        />
    );
};

const QuestionRenderer = (props) => {
    const { question, answer, onAnswerChange, disabled = false, allAnswers, highlights, onHighlight } = props;
    const { id, type, question: questionText, options, image_url, notes } = question;

    const handleChange = (value) => {
        if (!disabled) {
            onAnswerChange(id, value);
        }
    };

    // Helper to render instruction block (e.g., List of Headings)
    const renderInstructionBlock = () => {
        if (!question.instruction_block) return null;

        const { title, items } = question.instruction_block;

        return (
            <div className="mb-6 mx-auto max-w-md border-2 border-gray-800 dark:border-gray-200 p-4">
                {title && (
                    <h4 className="text-center font-bold text-lg mb-4 text-gray-900 dark:text-gray-100 uppercase">
                        {title}
                    </h4>
                )}
                <div className="space-y-1">
                    {items && items.map((item, idx) => {
                        const match = item.match(/^([A-Z])\s+(.+)$/);
                        if (match) {
                            return (
                                <div key={idx} className="flex gap-4">
                                    <span className="w-8 font-bold text-right flex-shrink-0">{match[1]}</span>
                                    <span>{match[2]}</span>
                                </div>
                            )
                        }
                        return <div key={idx}>{item}</div>;
                    })}
                </div>
            </div>
        );
    };

    // Helper to render notes/instructions at the top
    const renderNotes = () => {
        if (!notes) return null;
        return (
            <div className="mb-4 text-gray-700 dark:text-gray-300 italic whitespace-pre-wrap">
                {notes}
            </div>
        );
    };

    // Helper to render table question
    const renderTable = () => {
        if (!question.table_data) return null;
        const { title, headers, rows } = question.table_data;

        const renderCellContent = (content) => {
            const parts = content.split(/(\*\*\d+\*\*)/);
            return parts.map((part, idx) => {
                const match = part.match(/\*\*(\d+)\*\*/);
                if (match) {
                    const qId = parseInt(match[1]);
                    const val = (props.allAnswers && props.allAnswers[qId]) || '';

                    return (
                        <span key={idx} className="inline-flex items-center mx-1">
                            <span className="font-bold text-gray-500 mr-1 text-sm">{qId}</span>
                            <input
                                type="text"
                                value={val}
                                onChange={(e) => {
                                    if (!disabled) onAnswerChange(qId, e.target.value)
                                }}
                                disabled={disabled}
                                className="border-b border-gray-400 dark:border-gray-500 bg-transparent focus:border-primary-600 focus:outline-none min-w-[80px] w-[120px] text-center font-bold text-blue-700 dark:text-blue-300 h-6"
                            />
                        </span>
                    );
                }
                return <span key={idx} dangerouslySetInnerHTML={{ __html: part }} />;
            });
        };

        return (
            <div className="mb-8 overflow-x-auto">
                {title && <h4 className="text-center font-bold text-lg mb-4 text-gray-900 dark:text-gray-100">{title}</h4>}
                <table className="w-full text-sm text-left text-gray-700 dark:text-gray-300 border-collapse border border-gray-300 dark:border-gray-600">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-100 dark:bg-gray-700 dark:text-gray-200">
                        <tr>
                            {headers.map((h, i) => (
                                <th key={i} className="px-4 py-3 border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 font-bold">
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, rIdx) => (
                            <tr key={rIdx} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
                                {row.map((cell, cIdx) => (
                                    <td key={cIdx} className="px-4 py-4 border border-gray-300 dark:border-gray-600 align-top">
                                        {renderCellContent(cell)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    // Helper to render image
    const renderImage = () => {
        if (!image_url) return null;
        return (
            <div className="mb-4 flex justify-center">
                <img
                    src={image_url}
                    alt={`Question ${id} reference`}
                    className="max-w-full h-auto max-h-[500px] object-contain rounded-lg border border-gray-200 dark:border-gray-700"
                />
            </div>
        );
    };

    // Helper to render question text with inline input
    const renderInlineQuestion = () => {
        const parts = questionText.split(/(_+|\.{2,})/);

        if (parts.length > 1) {
            return (
                <div className="mb-2 text-gray-900 dark:text-gray-100 leading-[2.5] text-lg relative font-serif">
                    {renderNotes()}
                    {renderInstructionBlock()}
                    {renderImage()}
                    {parts.map((part, index) => {
                        if (part.match(/^(_+|\.{2,})$/)) {
                            return (
                                <input
                                    key={index}
                                    type="text"
                                    value={answer || ''}
                                    onChange={(e) => handleChange(e.target.value)}
                                    disabled={disabled}
                                    className="mx-1 px-1 border-b border-gray-400 dark:border-gray-500 bg-transparent focus:border-primary-600 focus:outline-none min-w-[120px] max-w-[200px] text-center font-bold text-blue-700 dark:text-blue-300 transition-colors inline-block"
                                    style={{
                                        height: '1.4em',
                                        verticalAlign: 'baseline',
                                        borderBottomStyle: 'solid',
                                        borderBottomWidth: '1px'
                                    }}
                                    autoComplete="off"
                                />
                            );
                        }
                        return (
                            <QuestionTextHighlighter
                                key={index}
                                text={part}
                                contextId={`q${id}_part${index}`}
                                highlights={highlights}
                                onHighlight={onHighlight}
                            />
                        );
                    })}
                </div>
            );
        }

        return (
            <div className="mb-2 flex flex-col gap-2 text-gray-900 dark:text-gray-100 text-lg font-serif">
                {renderNotes()}
                {renderInstructionBlock()}
                {renderImage()}
                <div className="flex flex-wrap items-baseline gap-2">
                    <QuestionTextHighlighter
                        text={questionText}
                        contextId={`q${id}_text`}
                        highlights={highlights}
                        onHighlight={onHighlight}
                    />
                    <input
                        type="text"
                        value={answer || ''}
                        onChange={(e) => handleChange(e.target.value)}
                        disabled={disabled}
                        className="flex-1 px-2 border-b border-gray-400 dark:border-gray-500 bg-transparent focus:border-primary-600 outline-none min-w-[100px] font-bold text-blue-700 dark:text-blue-300"
                    />
                </div>
            </div>
        );
    };

    // Helper to render dropdown select for multiple choice with 3+ options
    const renderDropdownMultiple = () => {
        return (
            <div className="mb-6 font-serif">
                {renderNotes()}
                {renderInstructionBlock()}
                {renderImage()}
                <div className="mb-3 text-lg text-gray-900 dark:text-gray-100">
                    <QuestionTextHighlighter
                        text={questionText}
                        contextId={`q${id}_text`}
                        highlights={highlights}
                        onHighlight={onHighlight}
                    />
                </div>
                <div className="relative">
                    <select
                        value={answer || ''}
                        onChange={(e) => handleChange(e.target.value)}
                        disabled={disabled}
                        className={`w-full px-4 py-3 border rounded-lg appearance-none cursor-pointer transition-all
                            bg-white dark:bg-gray-800 
                            text-gray-900 dark:text-white
                            border-gray-300 dark:border-gray-600
                            focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                            hover:border-gray-400 dark:hover:border-gray-500
                            disabled:opacity-50 disabled:cursor-not-allowed
                            ${answer ? 'font-semibold text-primary-700 dark:text-primary-300' : 'text-gray-500 dark:text-gray-400'}
                        `}
                        aria-label={`Answer for question ${id}`}
                    >
                        <option value="" disabled>
                            Select an answer...
                        </option>
                        {options && options.map((option, idx) => {
                            const optionLetter = option.charAt(0);
                            return (
                                <option key={idx} value={optionLetter}>
                                    {option}
                                </option>
                            );
                        })}
                    </select>
                    {/* Custom dropdown arrow */}
                    <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                        <svg
                            className="w-5 h-5 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </div>
                {answer && (
                    <div className="mt-2 text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Selected: {answer}
                    </div>
                )}
            </div>
        );
    };

    // Helper to render radio buttons for multiple choice (used for 2 options or less)
    const renderRadioMultiple = () => {
        return (
            <div className="mb-6 font-serif">
                {renderNotes()}
                {renderInstructionBlock()}
                {renderImage()}
                <div className="mb-2 text-lg text-gray-900 dark:text-gray-100">
                    <QuestionTextHighlighter
                        text={questionText}
                        contextId={`q${id}_text`}
                        highlights={highlights}
                        onHighlight={onHighlight}
                    />
                </div>
                <div className="pl-6 space-y-1">
                    {options && options.map((option, idx) => {
                        const optionLetter = option.charAt(0);
                        return (
                            <label
                                key={idx}
                                className={`flex items-start p-1 rounded cursor-pointer transition-colors border border-transparent ${answer === optionLetter
                                    ? 'bg-blue-50 dark:bg-blue-900/20'
                                    : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                                    }`}
                            >
                                <div className="flex items-center h-6 mr-2">
                                    <input
                                        type="radio"
                                        name={`question-${id}`}
                                        value={optionLetter}
                                        checked={answer === optionLetter}
                                        onChange={(e) => handleChange(e.target.value)}
                                        disabled={disabled}
                                        className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 mt-0.5"
                                    />
                                </div>
                                <span className="text-base text-gray-800 dark:text-gray-200">{option}</span>
                            </label>
                        );
                    })}
                </div>
            </div>
        );
    };

    switch (type) {
        case 'fill':
        case 'short':
        case 'completion':
        case 'table_completion':
        case 'diagram':
            return renderInlineQuestion();

        case 'multiple':
            // Use dropdown for 3+ options, radio buttons for 2 or less
            if (options && options.length >= 3) {
                return renderDropdownMultiple();
            }
            return renderRadioMultiple();

        case 'tfng':
        case 'ynng':
            const tfOptions = type === 'tfng'
                ? ['TRUE', 'FALSE', 'NOT GIVEN']
                : ['YES', 'NO', 'NOT GIVEN'];

            return (
                <div className="mb-4 font-serif">
                    {renderNotes()}
                    {renderImage()}
                    <div className="mb-2 text-lg text-gray-900 dark:text-gray-100">
                        <QuestionTextHighlighter
                            text={questionText}
                            contextId={`q${id}_text`}
                            highlights={highlights}
                            onHighlight={onHighlight}
                        />
                    </div>
                    <div className="pl-6 flex flex-wrap gap-4">
                        {tfOptions.map((opt) => (
                            <label
                                key={opt}
                                className={`flex items-center px-3 py-1 border rounded cursor-pointer transition-colors ${answer === opt
                                    ? 'bg-primary-600 text-white border-primary-600'
                                    : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                                    }`}
                            >
                                <input
                                    type="radio"
                                    name={`question-${id}`}
                                    value={opt}
                                    checked={answer === opt}
                                    onChange={(e) => handleChange(e.target.value)}
                                    disabled={disabled}
                                    className="sr-only"
                                />
                                <span className="text-xs font-bold uppercase tracking-wider">
                                    {opt}
                                </span>
                            </label>
                        ))}
                    </div>
                </div>
            );

        case 'matching':
        case 'table':
            return (
                <div className="mb-2">
                    {renderNotes()}
                    {renderInstructionBlock()}
                    {renderTable()}
                </div>
            );

        default:
            return (
                <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        Question type "{type}" not yet supported. Question {id}: {questionText}
                    </p>
                </div>
            );
    }
};

export default QuestionRenderer;
