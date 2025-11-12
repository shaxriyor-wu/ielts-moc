import { useEffect, useRef } from 'react'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import { validateWordCount } from '../utils/scoring'

/**
 * Rich Text Editor with Word Count
 * @param {string} value - Editor content
 * @param {Function} onChange - Change handler
 * @param {number} minWords - Minimum word requirement
 * @param {string} placeholder - Placeholder text
 */
export default function RichEditor({ value, onChange, minWords, placeholder }) {
  const quillRef = useRef(null)

  useEffect(() => {
    // Configure Quill toolbar
    if (quillRef.current) {
      const quill = quillRef.current.getEditor()
      // Remove image and video from toolbar for simplicity
      const toolbar = quill.getModule('toolbar')
      toolbar.addHandler('image', () => {
        // Disable image upload in test environment
      })
    }
  }, [])

  const wordCount = value ? value.replace(/<[^>]*>/g, '').trim().split(/\s+/).filter((w) => w.length > 0).length : 0
  const validation = minWords ? validateWordCount(value || '', minWords) : { valid: true, wordCount }

  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['blockquote', 'code-block'],
      ['clean'],
    ],
  }

  return (
    <div className="space-y-2">
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value || ''}
        onChange={onChange}
        modules={modules}
        placeholder={placeholder}
        className="bg-white"
      />
      <div className="flex justify-between items-center text-sm">
        <span className={validation.valid ? 'text-gray-600' : 'text-accent-600'}>
          {validation.message}
        </span>
        {!validation.valid && (
          <span className="text-accent-600 font-medium">Minimum not met</span>
        )}
      </div>
    </div>
  )
}

