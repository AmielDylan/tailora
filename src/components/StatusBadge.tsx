import React from 'react';
import type { Status } from '../types';
import { statusClass } from '../helpers';

export function StatusBadge({ status }: { status: Status }) {
  return <span className={statusClass(status)}>{status}</span>;
}
