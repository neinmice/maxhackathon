import { useNavigate } from 'react-router-dom'
import { PageTitle } from '../Other'
import InDevelopmentCard from '../../components/InDevelopmentCard'

export default function InternshipService() {
  const nav = useNavigate()

  return (
    <div className="page" style={{ minHeight: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <PageTitle hl="Стажировка" color="white" back />

      <InDevelopmentCard
        title="Витрина стажировок"
        desc="Единая платформа поиска молодых специалистов и оплачиваемой практики для бизнеса через MAX."
        storageKey="zvery_internship_notify"
        serviceId="internship"
        onClose={() => nav('/')}
        closeLabel="На главную"
      />
    </div>
  )
}

