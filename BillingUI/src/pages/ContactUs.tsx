import { useState } from 'react'
import { Mail, Phone, MessageSquare, Send, MapPin, Clock } from 'lucide-react'
import api from '../services/api'
import { useToast } from '../hooks/useToast'
import { useAuth } from '../contexts/AuthContext'

interface IssueSubmission {
  subject: string
  description: string
  email: string
  phone: string
  priority: 'Low' | 'Medium' | 'High' | 'Urgent'
}

const ContactUs = () => {
  const { user } = useAuth()
  const { showToast, ToastContainer } = useToast()
  const [loading, setLoading] = useState<boolean>(false)
  const [formData, setFormData] = useState<IssueSubmission>({
    subject: '',
    description: '',
    email: user?.email || '',
    phone: user?.phone || '',
    priority: 'Medium',
  })

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    
    if (!formData.subject.trim() || !formData.description.trim()) {
      showToast('Please fill in all required fields', 'error')
      return
    }

    if (!formData.email.trim() || !formData.phone.trim()) {
      showToast('Please provide your email and phone number', 'error')
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      showToast('Please enter a valid email address', 'error')
      return
    }

    // Basic phone validation (at least 10 digits)
    const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/
    if (!phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
      showToast('Please enter a valid phone number', 'error')
      return
    }

    try {
      setLoading(true)
      await api.post('/contact/submit-issue', formData)
      showToast('Your issue has been submitted successfully. We will get back to you soon!', 'success')
      setFormData({
        subject: '',
        description: '',
        email: user?.email || '',
        phone: user?.phone || '',
        priority: 'Medium',
      })
    } catch (error: any) {
      console.error('Error submitting issue:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Failed to submit issue. Please try again.'
      showToast(errorMessage, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-0">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Contact Us</h1>
        <p className="mt-1 text-xs sm:text-sm text-gray-500">
          Get in touch with us or submit an issue
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Contact Information */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white shadow rounded-lg p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <Mail className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Email</h3>
                  <p className="text-sm text-gray-600 mt-1">abdulahmed81477@gmail.com</p>
                  <a 
                    href="mailto:abdulahmed81477@gmail.com" 
                    className="text-xs text-primary-600 hover:text-primary-800 mt-1 inline-block"
                  >
                    Send Email
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <Phone className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Phone</h3>
                  <p className="text-sm text-gray-600 mt-1">+91 9948733273</p>
                  <a 
                    href="tel:+919948733273" 
                    className="text-xs text-primary-600 hover:text-primary-800 mt-1 inline-block"
                  >
                    Call Now
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <Clock className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Business Hours</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Monday - Friday: 9:00 AM - 6:00 PM<br />
                    Saturday: 10:00 AM - 4:00 PM<br />
                    Sunday: Closed
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <MapPin className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Company</h3>
                  <p className="text-sm font-semibold text-gray-900 mt-1">Maqfin Technologies</p>
                  <p className="text-sm text-gray-600 mt-1">
                    2-102/1 Youth Colony Old Hafeezpet,<br />
                    Miyapur, Hyderabad-500049,<br />
                    Telangana, India
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Issue Submission Form */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-6">
              <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6 text-primary-600" />
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Submit an Issue</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary-500 focus:border-primary-500"
                    placeholder="your.email@example.com"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary-500 focus:border-primary-500"
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>

              {/* Priority */}
              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                  Priority <span className="text-red-500">*</span>
                </label>
                <select
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>

              {/* Subject */}
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                  Subject <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Brief description of your issue"
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary-500 focus:border-primary-500 resize-none"
                  placeholder="Please provide detailed information about your issue..."
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center px-4 sm:px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Submit Issue
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <ToastContainer />
    </div>
  )
}

export default ContactUs

