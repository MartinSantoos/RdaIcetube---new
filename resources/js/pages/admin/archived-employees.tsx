import { useState } from 'react'
import { Head, router, Link } from '@inertiajs/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { BarChart3, Package, Settings, ShoppingCart, Users, ArrowLeft, RotateCcw, Trash2, Search, Archive } from 'lucide-react'

interface User {
  id: number
  name: string
  username: string
  email: string
}

interface ArchivedEmployee {
  id: number
  name: string
  username: string
  email: string
  contact_number: string
  position: string
  status: 'active' | 'inactive'
  archived_at: string
}

interface Props {
  user: User
  archivedEmployees: ArchivedEmployee[]
}

export default function ArchivedEmployees({ user, archivedEmployees }: Props) {
  const [search, setSearch] = useState('')
  const [showRestoreDialog, setShowRestoreDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<ArchivedEmployee | null>(null)

  const filteredEmployees = archivedEmployees.filter(employee =>
    employee.name.toLowerCase().includes(search.toLowerCase()) ||
    employee.email.toLowerCase().includes(search.toLowerCase()) ||
    employee.position.toLowerCase().includes(search.toLowerCase()) ||
    employee.username.toLowerCase().includes(search.toLowerCase())
  )

  const handleRestore = () => {
    if (!selectedEmployee) return

    router.post(`/admin/employees/${selectedEmployee.id}/restore`, {}, {
      onSuccess: () => {
        setShowRestoreDialog(false)
        setSelectedEmployee(null)
      }
    })
  }

  const handlePermanentDelete = () => {
    if (!selectedEmployee) return

    router.delete(`/admin/employees/${selectedEmployee.id}/force-delete`, {
      onSuccess: () => {
        setShowDeleteDialog(false)
        setSelectedEmployee(null)
      }
    })
  }

  const openRestoreDialog = (employee: ArchivedEmployee) => {
    setSelectedEmployee(employee)
    setShowRestoreDialog(true)
  }

  const openDeleteDialog = (employee: ArchivedEmployee) => {
    setSelectedEmployee(employee)
    setShowDeleteDialog(true)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Head title="Archived Employees - RDA Tube Ice" />
      
      {/* Header */}
      <header className="bg-blue-600 text-white shadow-lg">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold">RDA Tube Ice</h1>
            <div className="h-6 w-px bg-blue-400"></div>
            <div className="flex items-center space-x-2">
              <div className="bg-blue-500 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                {user.name?.charAt(0) || 'A'}
              </div>
              <div>
                <div className="text-sm font-medium">{user.name || 'Admin'}</div>
                <div className="text-xs text-blue-200">{user.username || 'admin'}</div>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-blue-600 min-h-screen text-white">
          <div className="p-6">
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4">Menu</h2>
              <nav className="space-y-2">
                <Link href="/admin/dashboard" className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors">
                  <BarChart3 className="w-5 h-5" />
                  <span>Dashboard</span>
                </Link>
                <Link href="/admin/employees" className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors">
                  <Users className="w-5 h-5" />
                  <span>Employees</span>
                </Link>
                <Link href="/admin/employees/archived" className="flex items-center space-x-3 px-4 py-3 rounded-lg bg-blue-700">
                  <Archive className="w-5 h-5" />
                  <span>Archived Employees</span>
                </Link>
                <Link href="/admin/inventory-new" className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors">
                  <Package className="w-5 h-5" />
                  <span>Inventory</span>
                </Link>
                <Link href="/admin/point-of-sales" className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors">
                  <ShoppingCart className="w-5 h-5" />
                  <span>Point of Sales</span>
                </Link>
                <Link href="/admin/settings" className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors">
                  <Settings className="w-5 h-5" />
                  <span>Settings</span>
                </Link>
              </nav>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-4">
                <Button
                  variant="outline"
                  onClick={() => router.get('/admin/employees')}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Employees
                </Button>
                <div className="flex-1" />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Archived Employees
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Manage archived employees - restore or permanently delete
                  </p>
                </div>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search archived employees..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="text-sm text-gray-500">
                  {filteredEmployees.length} of {archivedEmployees.length} archived employees
                </div>
              </div>
            </div>

            {/* Archived Employees Table */}
            <div className="bg-white rounded-lg shadow-sm">
              {filteredEmployees.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Trash2 className="h-6 w-6 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No archived employees found
                  </h3>
                  <p className="text-gray-500">
                    {search ? 'Try adjusting your search criteria.' : 'No employees have been archived yet.'}
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Archived Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEmployees.map((employee) => (
                      <TableRow key={employee.id}>
                        <TableCell className="font-medium">{employee.name}</TableCell>
                        <TableCell className="text-gray-600">
                          {employee.username}
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {employee.email}
                        </TableCell>
                        <TableCell>{employee.contact_number}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{employee.position}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={employee.status === 'active' ? 'default' : 'secondary'}>
                            {employee.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {formatDate(employee.archived_at)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openRestoreDialog(employee)}
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openDeleteDialog(employee)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Restore Confirmation Dialog */}
      <Dialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Restore Employee</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-600">
              Are you sure you want to restore <strong>{selectedEmployee?.name}</strong>? 
              They will be moved back to the active employees list.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRestoreDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleRestore} className="bg-green-600 hover:bg-green-700">
              <RotateCcw className="h-4 w-4 mr-2" />
              Restore Employee
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Permanent Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="text-red-600">Permanent Delete</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-600 mb-3">
              Are you sure you want to <strong className="text-red-600">permanently delete</strong> <strong>{selectedEmployee?.name}</strong>?
            </p>
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-red-700 text-sm font-medium">
                ⚠️ Warning: This action cannot be undone!
              </p>
              <p className="text-red-600 text-sm mt-1">
                All employee data will be permanently removed from the system.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handlePermanentDelete} 
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Permanently Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}