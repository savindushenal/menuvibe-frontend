'use client';

import { useCallback, useRef, useEffect } from 'react';

// Sound types mapped to different notification priorities/types
export type SoundType = 
  | 'notification'      // Default notification sound
  | 'message'           // New message in ticket
  | 'ticket_new'        // New ticket created
  | 'ticket_assigned'   // Ticket assigned to you
  | 'ticket_urgent'     // Urgent/critical ticket
  | 'ticket_resolved'   // Ticket resolved
  | 'success'           // Success action
  | 'error';            // Error action

// Sound configurations with frequencies and patterns for Web Audio API
const SOUND_CONFIGS: Record<SoundType, { frequencies: number[]; durations: number[]; type: OscillatorType; volume: number }> = {
  notification: {
    frequencies: [800, 600],
    durations: [100, 100],
    type: 'sine',
    volume: 0.3,
  },
  message: {
    frequencies: [600, 800],
    durations: [80, 80],
    type: 'sine',
    volume: 0.25,
  },
  ticket_new: {
    frequencies: [523, 659, 784], // C5, E5, G5 - pleasant chord
    durations: [100, 100, 150],
    type: 'sine',
    volume: 0.3,
  },
  ticket_assigned: {
    frequencies: [440, 554, 659], // A4, C#5, E5
    durations: [100, 100, 100],
    type: 'sine',
    volume: 0.3,
  },
  ticket_urgent: {
    frequencies: [880, 0, 880, 0, 880], // Urgent beeping pattern
    durations: [150, 100, 150, 100, 200],
    type: 'square',
    volume: 0.4,
  },
  ticket_resolved: {
    frequencies: [523, 659, 784, 1047], // C5, E5, G5, C6 - success fanfare
    durations: [100, 100, 100, 200],
    type: 'sine',
    volume: 0.25,
  },
  success: {
    frequencies: [600, 800],
    durations: [100, 150],
    type: 'sine',
    volume: 0.2,
  },
  error: {
    frequencies: [300, 200],
    durations: [150, 200],
    type: 'sawtooth',
    volume: 0.3,
  },
};

// Map notification types to sound types
export function getNotificationSoundType(notificationType: string, priority?: string): SoundType {
  // Priority-based sounds
  if (priority === 'urgent' || priority === 'critical') {
    return 'ticket_urgent';
  }
  
  // Notification type based sounds
  switch (notificationType) {
    case 'ticket_new':
    case 'new_ticket':
      return 'ticket_new';
    case 'ticket_assigned':
    case 'ticket_auto_assigned':
      return 'ticket_assigned';
    case 'ticket_urgent':
    case 'urgent_ticket':
      return 'ticket_urgent';
    case 'ticket_resolved':
    case 'ticket_closed':
      return 'ticket_resolved';
    case 'ticket_message':
    case 'new_message':
      return 'message';
    case 'success':
      return 'success';
    case 'error':
      return 'error';
    default:
      return 'notification';
  }
}

// Map ticket actions to sound types
export function getTicketActionSoundType(action: string, priority?: string): SoundType {
  console.log('getTicketActionSoundType called:', { action, priority });
  
  if (priority === 'urgent') {
    console.log('Urgent priority detected, returning ticket_urgent');
    return 'ticket_urgent';
  }
  
  switch (action) {
    case 'created':
      return 'ticket_new';
    case 'assigned':
    case 'auto_assigned':
    case 'self_assigned':
      return 'ticket_assigned';
    case 'status_changed':
      return 'notification';
    case 'new_message':
    case 'reply':
      return 'message';
    case 'resolved':
    case 'closed':
      return 'ticket_resolved';
    default:
      return 'notification';
  }
}

export function useNotificationSound() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const isEnabledRef = useRef<boolean>(true);
  const hasUserInteracted = useRef<boolean>(false);

  // Initialize audio context on first user interaction
  useEffect(() => {
    const initAudioContext = () => {
      hasUserInteracted.current = true;
      if (!audioContextRef.current) {
        try {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
          console.log('AudioContext initialized');
        } catch (e) {
          console.error('Failed to create AudioContext:', e);
        }
      }
    };

    // Initialize on any user interaction
    const events = ['click', 'touchstart', 'keydown'];
    events.forEach(event => {
      document.addEventListener(event, initAudioContext, { once: false });
    });

    // Check localStorage for sound preference
    const soundEnabled = localStorage.getItem('notification_sound_enabled');
    isEnabledRef.current = soundEnabled !== 'false';
    console.log('Sound enabled from localStorage:', isEnabledRef.current, 'raw value:', soundEnabled);

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, initAudioContext);
      });
    };
  }, []);

  const playSound = useCallback(async (soundType: SoundType) => {
    if (!isEnabledRef.current) {
      console.log('Sound disabled, not playing');
      return;
    }

    try {
      // Initialize audio context if needed
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const ctx = audioContextRef.current;
      
      // Resume if suspended (browser autoplay policy)
      if (ctx.state === 'suspended') {
        console.log('Resuming suspended AudioContext');
        await ctx.resume();
      }

      console.log(`Playing sound: ${soundType}`);
      const config = SOUND_CONFIGS[soundType];
      let startTime = ctx.currentTime;

      config.frequencies.forEach((freq, index) => {
        if (freq === 0) {
          // Silent gap
          startTime += config.durations[index] / 1000;
          return;
        }

        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.type = config.type;
        oscillator.frequency.setValueAtTime(freq, startTime);

        // Envelope for smooth sound
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(config.volume, startTime + 0.01);
        gainNode.gain.linearRampToValueAtTime(config.volume * 0.7, startTime + config.durations[index] / 1000 - 0.02);
        gainNode.gain.linearRampToValueAtTime(0, startTime + config.durations[index] / 1000);

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.start(startTime);
        oscillator.stop(startTime + config.durations[index] / 1000);

        startTime += config.durations[index] / 1000;
      });
    } catch (error) {
      console.warn('Failed to play notification sound:', error);
    }
  }, []);

  const setEnabled = useCallback((enabled: boolean) => {
    isEnabledRef.current = enabled;
    localStorage.setItem('notification_sound_enabled', enabled.toString());
  }, []);

  const isEnabled = useCallback(() => {
    return isEnabledRef.current;
  }, []);

  return {
    playSound,
    setEnabled,
    isEnabled,
    // Convenience methods
    playNotification: () => playSound('notification'),
    playMessage: () => playSound('message'),
    playNewTicket: () => playSound('ticket_new'),
    playTicketAssigned: () => playSound('ticket_assigned'),
    playUrgent: () => playSound('ticket_urgent'),
    playSuccess: () => playSound('success'),
    playError: () => playSound('error'),
  };
}
