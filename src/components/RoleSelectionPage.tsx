"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Shield, ArrowRight } from "lucide-react";
import { Leaf } from 'lucide-react';


export function RoleSelectionPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-muted/40 p-4">
            <div className="mb-12 text-center">
                <div className="inline-flex items-center gap-3 mb-4">
                    <div className="p-3 bg-primary/10 rounded-lg">
                        <Leaf className="text-primary" size={32} />
                    </div>
                    <h1 className="text-4xl font-bold text-foreground tracking-tight">
                        Welcome to Verdora, the Precision Agriculture Platform
                    </h1>
                </div>
                <p className="text-lg text-muted-foreground max-w-2xl">
                    Please select your role to continue.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
                <Card className="hover:shadow-xl transition-shadow duration-300">
                    <CardHeader className="text-center">
                        <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit">
                            <User className="w-10 h-10 text-primary" />
                        </div>
                        <CardTitle className="mt-4 text-2xl">Farmer</CardTitle>
                        <CardDescription>
                            Access farmer-specific tools and information.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                        <Button asChild size="lg" variant="outline">
                            <Link href="/farmer">
                                Go to Farmer Portal <ArrowRight className="ml-2" />
                            </Link>
                        </Button>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-xl transition-shadow duration-300">
                    <CardHeader className="text-center">
                         <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit">
                            <Shield className="w-10 h-10 text-primary" />
                        </div>
                        <CardTitle className="mt-4 text-2xl">Admin</CardTitle>
                        <CardDescription>
                            Manage farmers, send alerts, and view analytics.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                        <Button asChild size="lg">
                            <Link href="/dashboard">
                                Go to Admin Dashboard <ArrowRight className="ml-2" />
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
             <footer className="py-6 px-4 md:px-6 mt-12">
                <div className="container mx-auto text-center text-sm text-muted-foreground">
                © {new Date().getFullYear()} Verdora. All rights reserved.
                </div>
            </footer>
        </div>
    );
}
