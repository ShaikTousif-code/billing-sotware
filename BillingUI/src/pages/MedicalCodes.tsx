import { useEffect, useState } from 'react'
import api from '../services/api'
import { Search, Stethoscope } from 'lucide-react'
import { ICD10Code, CPTCode } from '../types'
import { useDebounce } from '../hooks/useDebounce'
import { useToast } from '../hooks/useToast'
import { TableSkeleton } from '../components/LoadingSkeleton'

const MedicalCodes = () => {
  const [activeTab, setActiveTab] = useState<'icd10' | 'cpt'>('icd10')
  const [icd10Codes, setIcd10Codes] = useState<ICD10Code[]>([])
  const [cptCodes, setCptCodes] = useState<CPTCode[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [category, setCategory] = useState<string>('')

  const { showToast, ToastContainer } = useToast()
  const debouncedSearch = useDebounce(searchTerm, 500)

  useEffect(() => {
    fetchCodes()
  }, [activeTab, debouncedSearch, category])

  const fetchCodes = async (): Promise<void> => {
    try {
      setLoading(true)
      const params: any = {}
      if (debouncedSearch) params.search = debouncedSearch
      if (category) params.category = category
      
      if (activeTab === 'icd10') {
        const response = await api.get<{ data: ICD10Code[] }>('/medical-codes/icd10', { params })
        const codesData = response.data?.data || response.data || []
        setIcd10Codes(Array.isArray(codesData) ? codesData : [])
      } else {
        const response = await api.get<{ data: CPTCode[] }>('/medical-codes/cpt', { params })
        const codesData = response.data?.data || response.data || []
        setCptCodes(Array.isArray(codesData) ? codesData : [])
      }
    } catch (error) {
      console.error('Error fetching medical codes:', error)
      showToast('Failed to fetch medical codes', 'error')
      if (activeTab === 'icd10') {
        setIcd10Codes([])
      } else {
        setCptCodes([])
      }
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-64 bg-gray-200 rounded animate-pulse mt-2"></div>
          </div>
        </div>
        <TableSkeleton rows={8} columns={5} />
      </div>
    )
  }

  const currentCodes = activeTab === 'icd10' ? icd10Codes : cptCodes

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Medical Codes</h1>
          <p className="mt-1 text-sm text-gray-500">
            Browse ICD-10 and CPT medical codes
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab('icd10')}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === 'icd10'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              ICD-10 Codes
            </button>
            <button
              onClick={() => setActiveTab('cpt')}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === 'cpt'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              CPT Codes
            </button>
          </nav>
        </div>

        {/* Search and Filters */}
        <div className="p-4 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder={`Search ${activeTab === 'icd10' ? 'ICD-10' : 'CPT'} codes...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <input
                type="text"
                placeholder="Category (optional)"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
        </div>

        {/* Codes Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                {activeTab === 'cpt' && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Typical Fee
                  </th>
                )}
                {activeTab === 'icd10' && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Chapter
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentCodes.length === 0 ? (
                <tr>
                  <td colSpan={activeTab === 'icd10' ? 4 : 4} className="px-6 py-4 text-center text-gray-500">
                    No codes found
                  </td>
                </tr>
              ) : (
                currentCodes.map((code) => (
                  <tr key={code.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {code.code}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {code.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {code.category}
                    </td>
                    {activeTab === 'cpt' && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {code.typicalFee ? `$${code.typicalFee.toFixed(2)}` : '-'}
                      </td>
                    )}
                    {activeTab === 'icd10' && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {code.chapter || '-'}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ToastContainer />
    </div>
  )
}

export default MedicalCodes

