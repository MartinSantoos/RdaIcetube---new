import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle, Eye, EyeOff } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
}

export default function Login({ status, canResetPassword }: LoginProps) {
    const { data, setData, post, processing, errors, reset } = useForm({
        username: '',
        password: '',
    });

    const [showPassword, setShowPassword] = useState(false);

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post('/login', {
            onFinish: () => {
                reset('password');
            },
        });
    };
    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
            <Head title="RDA ICE Tube - Login" />
            
            {/* Animated Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900">
                {/* Blue Tubes/Cylinders */}
                <div className="absolute inset-0">
                    {/* Large tubes */}
                    <div className="absolute -top-20 -left-20 w-40 h-96 bg-gradient-to-b from-blue-400 to-blue-600 rounded-full opacity-80 transform rotate-12"></div>
                    <div className="absolute top-1/4 -right-16 w-32 h-80 bg-gradient-to-b from-blue-500 to-blue-700 rounded-full opacity-70 transform -rotate-6"></div>
                    <div className="absolute bottom-0 left-1/4 w-36 h-72 bg-gradient-to-b from-blue-300 to-blue-500 rounded-full opacity-75 transform rotate-45"></div>
                    <div className="absolute top-1/2 left-1/3 w-24 h-48 bg-gradient-to-b from-blue-400 to-blue-600 rounded-full opacity-60 transform -rotate-12"></div>
                    <div className="absolute bottom-1/4 right-1/4 w-28 h-56 bg-gradient-to-b from-blue-500 to-blue-700 rounded-full opacity-65 transform rotate-30"></div>
                    
                    {/* Medium tubes */}
                    <div className="absolute top-10 left-1/2 w-20 h-40 bg-gradient-to-b from-blue-300 to-blue-500 rounded-full opacity-50 transform rotate-75"></div>
                    <div className="absolute bottom-10 left-10 w-16 h-32 bg-gradient-to-b from-blue-400 to-blue-600 rounded-full opacity-55 transform -rotate-30"></div>
                    <div className="absolute top-3/4 right-10 w-18 h-36 bg-gradient-to-b from-blue-500 to-blue-700 rounded-full opacity-45 transform rotate-60"></div>
                    
                    {/* Small tubes */}
                    <div className="absolute top-1/3 left-20 w-12 h-24 bg-gradient-to-b from-blue-200 to-blue-400 rounded-full opacity-40 transform rotate-90"></div>
                    <div className="absolute bottom-1/3 right-1/3 w-14 h-28 bg-gradient-to-b from-blue-300 to-blue-500 rounded-full opacity-35 transform -rotate-45"></div>
                    <div className="absolute top-20 right-20 w-10 h-20 bg-gradient-to-b from-blue-400 to-blue-600 rounded-full opacity-50 transform rotate-15"></div>
                    
                    {/* Additional decorative elements */}
                    <div className="absolute top-1/6 right-1/2 w-6 h-12 bg-blue-400 rounded-full opacity-30 transform rotate-45"></div>
                    <div className="absolute bottom-1/6 left-1/2 w-8 h-16 bg-blue-500 rounded-full opacity-25 transform -rotate-60"></div>
                </div>
            </div>
            
            <div className="max-w-md w-full space-y-8 p-8 relative z-10">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-white mb-2">RDA ICE Tube</h1>
                    <p className="text-gray-200">Log in to your account</p>
                </div>

                <div className="bg-white/95 backdrop-blur-sm p-8 rounded-lg shadow-2xl border border-white/20">
                    <form onSubmit={submit} className="space-y-6">
                        {/* General Error Message */}
                        {(errors.username || errors.password) && (
                            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                                <div className="flex">
                                    <svg className="w-5 h-5 text-red-400 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                    <div>
                                        <h3 className="text-sm font-medium text-red-800">Login Failed</h3>
                                        <div className="text-sm text-red-700 mt-1">
                                            {errors.username && <p>{errors.username}</p>}
                                            {errors.password && <p>{errors.password}</p>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div>
                            <Label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                                Username
                            </Label>
                            <Input
                                id="username"
                                type="text"
                                value={data.username}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    // Capitalize first letter while preserving the rest
                                    const capitalizedValue = value.charAt(0).toUpperCase() + value.slice(1);
                                    setData('username', capitalizedValue);
                                }}
                                required
                                autoFocus
                                tabIndex={1}
                                autoComplete="username"
                                placeholder="Enter your Username"
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                    errors.username ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                }`}
                            />
                            <InputError message={errors.username} />
                        </div>

                        <div>
                            <Label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                Password
                            </Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    required
                                    tabIndex={2}
                                    autoComplete="current-password"
                                    placeholder="Password"
                                    className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                        errors.password ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                    }`}
                                />
                                <button
                                    type="button"
                                    onClick={togglePasswordVisibility}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                                    tabIndex={-1}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-5 w-5" />
                                    ) : (
                                        <Eye className="h-5 w-5" />
                                    )}
                                </button>
                            </div>
                            <InputError message={errors.password} />
                        </div>

                        <Button 
                            type="submit" 
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition duration-200 flex items-center justify-center shadow-lg hover:shadow-xl" 
                            tabIndex={3} 
                            disabled={processing}
                        >
                            {processing && <LoaderCircle className="h-4 w-4 animate-spin mr-2" />}
                            Login
                        </Button>
                    </form>

                    {status && <div className="mt-4 text-center text-sm font-medium text-green-600">{status}</div>}
                </div>
            </div>
        </div>
    );
}
