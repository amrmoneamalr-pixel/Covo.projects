import { Routes, Route } from 'react-router-dom'
import Projects from './pages/Projects'
import AdminLayout from './pages/admin/AdminLayout'
import ImportExcel from './pages/admin/ImportExcel'
import ManageProjects from './pages/admin/ManageProjects'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Projects />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<ImportExcel />} />
        <Route path="projects" element={<ManageProjects />} />
      </Route>
    </Routes>
  )
}
