'use client';

import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/features/ui/components/ui/dialog';
import { Button } from '@/features/ui/components/ui/button';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';

const STORAGE_KEY = 'dismissOfferModal';

export default function OneTimeOfferModal() {
  const [show, setShow] = useState(false);
  const t = useTranslations('Pricing');
  const router = useRouter();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const dismissed = sessionStorage.getItem(STORAGE_KEY) === '1';
    setShow(!dismissed);
  }, []);

  const close = () => {
    sessionStorage.setItem(STORAGE_KEY, '1');
    setShow(false);
  };

  const proceed = () => {
    close();
    router.push('/price');
  };

  if (!show) return null;

  const packages = t.raw('offerModal.packages') as string[];

  return (
    <Dialog open={show} onOpenChange={close}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className='text-center'>{t('offerModal.title')}</DialogTitle>
        </DialogHeader>

        <p className='text-center'>{t('offerModal.description')}</p>

        <ul className='text-center'>
          {packages.map((pkg, index) => (
            <li key={index}>{pkg}</li>
          ))}
        </ul>

        <DialogFooter>
          <Button onClick={proceed}>{t('offerModal.proceed')}</Button>
          <Button variant="outline" onClick={close}>{t('offerModal.okay')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}