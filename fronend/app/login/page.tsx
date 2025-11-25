"use client";
import React, { useEffect } from 'react'

const page = () => {
    useEffect(() => {
        const res =  fetch('http://localhost:3000/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: 'tester@test.com',
          password: 'Test@123',
        }),
        })
    }, [])
    // console.log(res)
  return (
    <div>
      hey
    </div>
  )
}

export default page
