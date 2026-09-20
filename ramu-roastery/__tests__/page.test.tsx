import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import Page from '../src/app/page'

// Mock useLang hook which is used in Page
jest.mock('../src/context/LanguageContext', () => ({
  useLang: () => ({ lang: 'id' }),
}))

// Mock useRouter
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}))

// Mock global fetch
global.fetch = jest.fn(() => 
  Promise.resolve({ 
    json: () => Promise.resolve([]) 
  })
) as jest.Mock

describe('Home Page', () => {
  it('renders a heading', () => {
    render(<Page />)
    
    // Check if hero title is rendered
    const heading = screen.getByText(/ROASTERY PARTNER TERPERCAYA ANDA/i)
    expect(heading).toBeInTheDocument()
  })
})
