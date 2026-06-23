'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Eye,
  LogOut,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { ProtectedRoute, useAuth } from '@/lib/auth';
import type { Patient } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { PatientForm } from './patient-form';

type SortField = 'lastName' | 'dob' | 'firstName' | 'email';
type SortOrder = 'asc' | 'desc';

export default function PatientsPageContent() {
  const { token, user, logout, isAdmin } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(5);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortField>('lastName');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [detailPatient, setDetailPatient] = useState<Patient | null>(null);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 4000);
  };

  const fetchPatients = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const result = await api.getPatients(token, {
        search: debouncedSearch || undefined,
        sortBy,
        sortOrder,
        page,
        limit,
      });
      setPatients(result.data);
      setTotal(result.total);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Failed to load patients';
      setError(message);
      if (err instanceof ApiError && err.status === 401) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  }, [token, debouncedSearch, sortBy, sortOrder, page, limit, logout]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const toggleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const handleCreate = async (values: Omit<Patient, 'id'>) => {
    if (!token) return;
    const optimistic: Patient = { ...values, id: `temp-${Date.now()}` };
    setPatients((prev) => [optimistic, ...prev]);
    setFormOpen(false);

    try {
      const created = await api.createPatient(token, values);
      setPatients((prev) =>
        prev.map((p) => (p.id === optimistic.id ? created : p)),
      );
      showToast('Patient created');
      fetchPatients();
    } catch {
      setPatients((prev) => prev.filter((p) => p.id !== optimistic.id));
      showToast('Create failed — rolled back. Retry?');
      setFormOpen(true);
    }
  };

  const handleUpdate = async (values: Omit<Patient, 'id'>) => {
    if (!token || !editingPatient) return;
    const previous = editingPatient;
    const updated = { ...editingPatient, ...values };
    setPatients((prev) =>
      prev.map((p) => (p.id === previous.id ? updated : p)),
    );
    setEditingPatient(null);

    try {
      const saved = await api.updatePatient(token, previous.id, values);
      setPatients((prev) =>
        prev.map((p) => (p.id === previous.id ? saved : p)),
      );
      showToast('Patient updated');
    } catch {
      setPatients((prev) =>
        prev.map((p) => (p.id === previous.id ? previous : p)),
      );
      showToast('Update failed — rolled back');
      setEditingPatient(previous);
    }
  };

  const handleDelete = async (patient: Patient) => {
    if (!token || !confirm(`Delete ${patient.firstName} ${patient.lastName}?`)) {
      return;
    }
    const snapshot = patients;
    setPatients((prev) => prev.filter((p) => p.id !== patient.id));

    try {
      await api.deletePatient(token, patient.id);
      showToast('Patient deleted');
      fetchPatients();
    } catch {
      setPatients(snapshot);
      showToast('Delete failed — rolled back');
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <ProtectedRoute>
      <div className="min-h-screen">
        <header className="border-b border-border bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
            <div>
              <h1 className="text-xl font-semibold tracking-tight">Patients</h1>
              <p className="text-sm text-muted-foreground">
                Signed in as {user?.email} ·{' '}
                <span className="capitalize">{user?.role}</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => fetchPatients()}>
                <RefreshCw className="mr-1 h-4 w-4" />
                Refresh
              </Button>
              <Button variant="secondary" size="sm" onClick={logout}>
                <LogOut className="mr-1 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-8">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Input
              placeholder="Search by name or email…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="max-w-sm"
            />
            {isAdmin && (
              <Button onClick={() => setFormOpen(true)}>
                <Plus className="mr-1 h-4 w-4" />
                Add patient
              </Button>
            )}
          </div>

          {error && (
            <div className="mb-4 rounded-md border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
              {error}
              <Button
                variant="ghost"
                size="sm"
                className="ml-2"
                onClick={fetchPatients}
              >
                Retry
              </Button>
            </div>
          )}

          <div className="overflow-hidden rounded-lg border border-border bg-white shadow-sm">
            {loading ? (
              <div className="space-y-3 p-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : patients.length === 0 ? (
              <div className="px-4 py-16 text-center text-muted-foreground">
                No patients found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border bg-muted/50">
                    <tr>
                      <SortHeader
                        label="Name"
                        active={sortBy === 'lastName'}
                        order={sortOrder}
                        onClick={() => toggleSort('lastName')}
                      />
                      <SortHeader
                        label="Email"
                        active={sortBy === 'email'}
                        order={sortOrder}
                        onClick={() => toggleSort('email')}
                      />
                      <th className="px-4 py-3 text-left font-medium">Phone</th>
                      <SortHeader
                        label="DOB"
                        active={sortBy === 'dob'}
                        order={sortOrder}
                        onClick={() => toggleSort('dob')}
                      />
                      <th className="px-4 py-3 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patients.map((patient) => (
                      <tr
                        key={patient.id}
                        className="border-b border-border transition-colors hover:bg-muted/30"
                      >
                        <td className="px-4 py-3 font-medium">
                          {patient.firstName} {patient.lastName}
                        </td>
                        <td className="px-4 py-3">{patient.email}</td>
                        <td className="px-4 py-3">{patient.phoneNumber}</td>
                        <td className="px-4 py-3">{formatDate(patient.dob)}</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDetailPatient(patient)}
                              aria-label="View details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {isAdmin && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setEditingPatient(patient)}
                                  aria-label="Edit"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(patient)}
                                  aria-label="Delete"
                                >
                                  <Trash2 className="h-4 w-4 text-error" />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {!loading && total > 0 && (
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Page {page} of {totalPages} · {total} total
              </span>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </main>

        <Dialog open={formOpen} onClose={() => setFormOpen(false)} title="Add patient">
          <PatientForm
            onCancel={() => setFormOpen(false)}
            onSubmit={handleCreate}
            submitLabel="Create"
          />
        </Dialog>

        <Dialog
          open={!!editingPatient}
          onClose={() => setEditingPatient(null)}
          title="Edit patient"
        >
          {editingPatient && (
            <PatientForm
              defaultValues={editingPatient}
              onCancel={() => setEditingPatient(null)}
              onSubmit={handleUpdate}
            />
          )}
        </Dialog>

        <Dialog
          open={!!detailPatient}
          onClose={() => setDetailPatient(null)}
          title="Patient details"
        >
          {detailPatient && (
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <Detail label="First name" value={detailPatient.firstName} />
              <Detail label="Last name" value={detailPatient.lastName} />
              <Detail label="Email" value={detailPatient.email} />
              <Detail label="Phone" value={detailPatient.phoneNumber} />
              <Detail label="Date of birth" value={formatDate(detailPatient.dob)} />
            </dl>
          )}
        </Dialog>

        {toast && (
          <div className="fixed bottom-4 right-4 z-50 rounded-md bg-foreground px-4 py-2 text-sm text-white shadow-lg">
            {toast}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

function SortHeader({
  label,
  active,
  order,
  onClick,
}: {
  label: string;
  active: boolean;
  order: SortOrder;
  onClick: () => void;
}) {
  return (
    <th className="px-4 py-3 text-left">
      <button
        type="button"
        className="inline-flex items-center gap-1 font-medium hover:text-primary"
        onClick={onClick}
      >
        {label}
        {active &&
          (order === 'asc' ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          ))}
      </button>
    </th>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
