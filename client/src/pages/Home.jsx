import FeaturedSection from "../components/FeaturedSection"
import HeroSection from "../components/HeroSection"
import TrailerSection from "../components/TrailerSection"
import Loading from "../components/Loading"
import { useAppContext } from "../context/AppContext"

const Home = () => {
  const { showsLoading } = useAppContext()

  if (showsLoading) return <Loading />

  return (
    <>
      <HeroSection />
      <FeaturedSection />
      <TrailerSection />
    </>
  )
}

export default Home