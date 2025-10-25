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

    // Format date for display (DD/MM/YYYY)
    const formatDateForDisplay = (dateString: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB'); // DD/MM/YYYY format
    };

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
                            <div className="relative">
                                <Input
                                    id="startDate"
                                    type="text"
                                    value={formatDateForDisplay(startDate)}
                                    onClick={(e) => {
                                        const inputElement = e.target as HTMLInputElement;
                                        const rect = inputElement.getBoundingClientRect();
                                        
                                        // Create a temporary date input positioned over the clicked input
                                        const tempInput = document.createElement('input');
                                        tempInput.type = 'date';
                                        tempInput.value = startDate;
                                        tempInput.style.position = 'fixed';
                                        tempInput.style.top = `${rect.top}px`;
                                        tempInput.style.left = `${rect.left}px`;
                                        tempInput.style.width = `${rect.width}px`;
                                        tempInput.style.height = `${rect.height}px`;
                                        tempInput.style.opacity = '0';
                                        tempInput.style.pointerEvents = 'none';
                                        tempInput.style.zIndex = '9999';
                                        document.body.appendChild(tempInput);
                                        
                                        tempInput.onchange = (e) => {
                                            const target = e.target as HTMLInputElement;
                                            setStartDate(target.value);
                                            document.body.removeChild(tempInput);
                                        };
                                        
                                        tempInput.onblur = () => {
                                            // Clean up if user closes picker without selecting
                                            if (document.body.contains(tempInput)) {
                                                document.body.removeChild(tempInput);
                                            }
                                        };
                                        
                                        // Small delay to ensure element is in DOM before showing picker
                                        setTimeout(() => {
                                            tempInput.showPicker?.();
                                            
                                            // Fallback for browsers without showPicker
                                            if (!tempInput.showPicker) {
                                                tempInput.style.opacity = '1';
                                                tempInput.style.pointerEvents = 'auto';
                                                tempInput.focus();
                                                tempInput.click();
                                            }
                                        }, 10);
                                    }}
                                    className="w-full cursor-pointer"
                                    placeholder="Select start date"
                                    readOnly
                                />
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="endDate">End Date</Label>
                            <div className="relative">
                                <Input
                                    id="endDate"
                                    type="text"
                                    value={formatDateForDisplay(endDate)}
                                    onClick={(e) => {
                                        const inputElement = e.target as HTMLInputElement;
                                        const rect = inputElement.getBoundingClientRect();
                                        
                                        // Create a temporary date input positioned over the clicked input
                                        const tempInput = document.createElement('input');
                                        tempInput.type = 'date';
                                        tempInput.value = endDate;
                                        tempInput.style.position = 'fixed';
                                        tempInput.style.top = `${rect.top}px`;
                                        tempInput.style.left = `${rect.left}px`;
                                        tempInput.style.width = `${rect.width}px`;
                                        tempInput.style.height = `${rect.height}px`;
                                        tempInput.style.opacity = '0';
                                        tempInput.style.pointerEvents = 'none';
                                        tempInput.style.zIndex = '9999';
                                        document.body.appendChild(tempInput);
                                        
                                        tempInput.onchange = (e) => {
                                            const target = e.target as HTMLInputElement;
                                            setEndDate(target.value);
                                            document.body.removeChild(tempInput);
                                        };
                                        
                                        tempInput.onblur = () => {
                                            // Clean up if user closes picker without selecting
                                            if (document.body.contains(tempInput)) {
                                                document.body.removeChild(tempInput);
                                            }
                                        };
                                        
                                        // Small delay to ensure element is in DOM before showing picker
                                        setTimeout(() => {
                                            tempInput.showPicker?.();
                                            
                                            // Fallback for browsers without showPicker
                                            if (!tempInput.showPicker) {
                                                tempInput.style.opacity = '1';
                                                tempInput.style.pointerEvents = 'auto';
                                                tempInput.focus();
                                                tempInput.click();
                                            }
                                        }, 10);
                                    }}
                                    className="w-full cursor-pointer"
                                    placeholder="Select end date"
                                    readOnly
                                />
                            </div>
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