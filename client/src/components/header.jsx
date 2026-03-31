import React, { use } from 'react'
import assets from '../assets/assets'
import { useContext } from 'react'
import { AppContext } from '../context/AppContext.jsx'

const header = () => {

  const { userData } = useContext(AppContext) || {}
  

  return (
    <div className='flex flex-col items-center mt-20 px-4 text-center 
                    text-gray-600' >
      <img src={assets.header_img} alt="" className='w-36 h-36 rounded-full mb-6' />
      <h1 className='text-xl font-bold mb-2 flex items-center gap-2 sm:text-3xl'>
        Hey: { userData ? userData.name : 'Customer'}!
        <img src={ assets.hand_wave} alt="" className='w-8 aspect-square'/>
      </h1>
      <h2 className='text-3xl sm:text-5xl font-bold mb-4'>
        Welcome to AutoParts.
      </h2>
      <p className='mb-8 max-w-md'>
        We offer a wide range of high-quality auto parts for all makes and models, at competitive prices.
      </p>
      <button className='border border-gray-500 rounded-full px-8 py-2.5
       hover:bg-gray-100 transition-all'> 
        Get Started
      </button>
    </div>
  )
}

export default header