import React from 'react';
import { Chip } from '@mui/material';
import type { Role } from '../../types/backoffice';
import { ROLE_COLORS, ROLE_LABELS } from '../../constants';

export const RoleBadge: React.FC<{ role: Role; size?: 'small' | 'medium' }> = ({ role, size = 'small' }) => (
  <Chip label={ROLE_LABELS[role]} color={ROLE_COLORS[role]} size={size} sx={{ fontWeight: 700 }} />
);
