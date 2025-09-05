import './App.css'
import { Route, BrowserRouter as Routers, Routes } from 'react-router-dom'
import HomePage from './components/pages/home/homePage'
import { LoginPage } from './components/pages/login/loginPage'

export const App = () => {

  return (
    <Routers>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    </Routers>
  )
}

export default App
