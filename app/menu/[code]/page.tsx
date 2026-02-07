'use client';

import { useEffect, useState } from 'react';
import { getTemplate } from '@/lib/template-router';

interface PageProps {
  params: {
    code: string;
  };
}

/**
 * Public Menu Page with Dynamic Template Loading
 * 
 * This page:
 * 1. Fetches configuration from Laravel API
 * 2. Loads the correct template based on template_key
 * 3. Supports custom developer templates
 * 4. Falls back to default if template not found
 * 
 * URL: /menu/{shortCode}
 * Example: /menu/DEMO123
 */
export default function PublicMenuPage({ params }: PageProps) {
  const [templateKey, setTemplateKey] = useState<string>('default');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch config to determine which template to use
    const fetchTemplateKey = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
        const response = await fetch(`${apiUrl}/menu/${params.code}/config`);
        
        if (response.ok) {
          const result = await response.json();
          setTemplateKey(result.data?.endpoint?.template_key || 'default');
        }
      } catch (error) {
        console.error('Failed to fetch template config:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplateKey();
  }, [params.code]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  // Get the template component
  const TemplateComponent = getTemplate(templateKey);
  
  // Render the selected template
  return <TemplateComponent code={params.code} />;
}
