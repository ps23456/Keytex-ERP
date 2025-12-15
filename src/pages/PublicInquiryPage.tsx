import { useState } from 'react'
import PublicInquiryForm from '../components/PublicInquiryForm'
import { useMasters } from '../hooks/useMasters'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'

export default function PublicInquiryPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { createRecord } = useMasters('inquiry')

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true)
    try {
      // Transform public form data to match inquiry schema
      const inquiryData = {
        companyName: data.companyName,
        contactPerson: data.contactPerson,
        contactNumber: data.phoneNumber,
        email: data.emailAddress,
        address: data.address,
        source: 'website', // Default source for public inquiries
        status: 'pending',
        priority: 'low',
        followUps: 0,
        products: data.products.map((p: any) => ({
          ...p,
          deliveryTime: '', // Not required in public form
        })),
        createdAt: new Date().toISOString()
      }
      await createRecord(inquiryData)
    } catch (error) {
      console.error('Failed to submit inquiry:', error)
      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Submit Your Inquiry</h1>
          <p className="text-lg text-gray-600">Fill in the details below and we'll get back to you soon</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Inquiry Form</CardTitle>
          </CardHeader>
          <CardContent>
            <PublicInquiryForm onSubmit={handleSubmit} isLoading={isSubmitting} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

