
'use client';

import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Cookie } from "lucide-react";

interface CookieConsentProps {
    onAccept: () => void;
}

export function CookieConsent({ onAccept }: CookieConsentProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in-0">
            <Card className="w-full max-w-md m-4">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Cookie className="h-6 w-6 text-primary" />
                        <CardTitle>We Use Cookies</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <CardDescription>
                       We use cookies to enhance your experience and to help us understand how our visitors use the site. By continuing to use this site, you consent to the use of cookies. Please note that while this AI tool is powerful, it can make mistakes. Always double-check critical information.
                    </CardDescription>
                    <Button className="w-full" onClick={onAccept}>Accept and Continue</Button>
                </CardContent>
            </Card>
        </div>
    );
}

    
