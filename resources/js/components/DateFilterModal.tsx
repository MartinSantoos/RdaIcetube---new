import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, Download } from 'lucide-react';

interface DateFilterModalProps {
    isOpen: boolean;
    onClose: () => void;
    onExport: (startDate: string, endDate: string, format: 'pdf') => void;
    title: string;
    description?: string;
}

export default function DateFilterModal({ isOpen, onClose, onExport, title, description }: DateFilterModalProps) {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const handleExport = () => {
        if (!startDate || !endDate) {
            alert('Please select both start and end dates');
            return;
        }
        
        if (new Date(startDate) > new Date(endDate)) {
            alert('Start date cannot be later than end date');
            return;
        }

        onExport(startDate, endDate, 'pdf');
        onClose();
        
        // Reset form
        setStartDate('');
        setEndDate('');
    };

    const handleCancel = () => {
        onClose();
        // Reset form
        setStartDate('');
        setEndDate('');
    };

    // Set default dates (current month)
    React.useEffect(() => {
        if (isOpen && !startDate && !endDate) {
            const now = new Date();
            const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
            const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            
            setStartDate(firstDay.toISOString().split('T')[0]);
            setEndDate(lastDay.toISOString().split('T')[0]);
        }
    }, [isOpen, startDate, endDate]);

    return (
        <Dialog open={isOpen} onOpenChange={handleCancel}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Export {title}
                    </DialogTitle>
                    {description && (
                        <p className="text-sm text-gray-600 mt-2">{description}</p>
                    )}
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="startDate">Start Date</Label>
                            <Input
                                id="startDate"
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full"
                            />
                        </div>
                        <div>
                            <Label htmlFor="endDate">End Date</Label>
                            <Input
                                id="endDate"
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full"
                            />
                        </div>
                    </div>


                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleCancel}>
                        Cancel
                    </Button>
                    <Button onClick={handleExport} className="bg-blue-600 hover:bg-blue-700">
                        <Download className="h-4 w-4 mr-2" />
                        Export PDF
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}