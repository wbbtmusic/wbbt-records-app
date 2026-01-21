import React, { useState, useEffect } from 'react';
import { Card, Button, Badge } from '../components/ui.tsx';
import { FileSignature, PieChart, Download, Plus } from 'lucide-react';
import { ResponsiveContainer, PieChart as RePie, Pie, Cell, Tooltip } from 'recharts';
import { apiService } from '../services/apiService';

const Contracts: React.FC = () => {
    const [contracts, setContracts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const data = await apiService.getContracts();
            setContracts(data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSign = async (id: string) => {
        try {
            await apiService.signContract(id);
            loadData();
            alert('Contract signed successfully');
        } catch (error) {
            alert('Failed to sign contract');
        }
    };

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold font-display text-white">Smart Contracts</h1>
                    <p className="text-[#888]">Automated royalty splits and legal documents.</p>
                </div>
                <Button variant="accent"><Plus size={16} className="mr-2" /> New Contract</Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <h3 className="font-bold text-white mb-6">Your Contracts</h3>
                        {contracts.length === 0 && <div className="text-[#666] text-center py-8">No contracts found.</div>}
                        <div className="space-y-4">
                            {contracts.map(contract => (
                                <div key={contract.id} className="bg-[#111] p-4 rounded-3xl border border-[#222] flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-xl ${contract.status === 'SIGNED' ? 'bg-green-500/10 text-green-400' : 'bg-indigo-500/20 text-indigo-400'}`}>
                                            <FileSignature size={24} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-white text-sm capitalize">{contract.type} Agreement</h4>
                                            <p className="text-xs text-[#666]">Created {new Date(contract.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Badge status={contract.status} />
                                        {contract.status === 'PENDING' && (
                                            <Button variant="accent" className="h-8 text-xs" onClick={() => handleSign(contract.id)}>Sign Now</Button>
                                        )}
                                        {contract.status === 'SIGNED' && (
                                            <Button variant="ghost" className="h-8 text-xs"><Download size={14} className="mr-2" /> PDF</Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                <Card className="bg-[#15151A]">
                    <h3 className="font-bold text-white mb-4">Default Split Template</h3>
                    <div className="h-[200px] w-full flex items-center justify-center text-[#666] text-sm italic">
                        Select a release to view splits
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default Contracts;
