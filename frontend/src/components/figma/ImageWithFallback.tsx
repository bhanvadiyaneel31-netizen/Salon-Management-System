import React, { useState } from 'react'

// Gradient palettes for placeholder cards based on index
const GRADIENTS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
]

type ImageWithFallbackProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  gradientIndex?: number
}

export function ImageWithFallback(props: ImageWithFallbackProps) {
  const [didError, setDidError] = useState(false)

  const handleError = () => {
    setDidError(true)
  }

  const { src, alt, style, className, gradientIndex = 0, ...rest } = props
  const gradient = GRADIENTS[gradientIndex % GRADIENTS.length]

  return didError ? (
    <div
      className={`flex flex-col items-center justify-center ${className ?? ''}`}
      style={{ background: gradient, ...style }}
      data-original-url={src}
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-white/60 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      {alt && (
        <span className="text-white/80 text-xs font-medium text-center px-2 line-clamp-2">{alt}</span>
      )}
    </div>
  ) : (
    <img src={src} alt={alt} className={className} style={style} {...rest} onError={handleError} />
  )
}
