export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white py-6 mt-auto" role="contentinfo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm text-gray-400">
            © {new Date().getFullYear()} IELTS CD Mock Platform. For educational purposes.
          </p>
          <p className="text-xs text-gray-500 mt-2">
            This is a mock test platform. Scores are for practice only.
          </p>
        </div>
      </div>
    </footer>
  )
}

