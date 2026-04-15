import './globals.css'
import Navbar from '@/components/Navbar'

export const metadata = {
  title: 'EuroScore — Eurovision-style Scoreboard',
  description: 'Create and manage dynamic Eurovision-style voting scoreboards. The ultimate ScoreWIZ alternative.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        <Navbar />
        {children}
      </body>
    </html>
  )
}
