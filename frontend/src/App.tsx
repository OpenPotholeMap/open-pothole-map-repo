import './App.css'
import { Route, BrowserRouter as Routers, Routes } from 'react-router-dom'
import HomePage from './components/pages/home/homePage'
import { LoginPage } from './components/pages/login/loginPage'
import { SignupPage } from './components/pages/signup/signupPage'
import { ThemeProvider } from './contexts/theme-context'

export const App = () => {
  return (
    <ThemeProvider defaultTheme="light" storageKey="ui-theme">
      <Routers>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
        </Routes>
      </Routers>
    </ThemeProvider>
  )
}

export default App
