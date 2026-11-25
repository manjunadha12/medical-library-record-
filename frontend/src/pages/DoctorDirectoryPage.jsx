import { useAuth } from '../context/AuthContext';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Search,
  Award,
  Building,
  Briefcase,
  Phone,
  Mail,
  ShieldCheck,
  ChevronRight,
  UserCheck,
} from 'lucide-react';
import { doctorsApi } from '../services/api';
import { Badge } from '../components/common/Badge';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';

const SPECIALIZATIONS = [
  'All',
  'Cardiology',
  'Neurology',
  'General Medicine',
  'Oncology',
  'Orthopedics',
  'Radiology',
  'Pediatrics',
];

export const DoctorDirectoryPage = () => {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeSpec, setActiveSpec] = useState('All');

  useEffect(() => {
    fetchDoctors();
  }, [search, activeSpec]);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (activeSpec && activeSpec !== 'All') params.specialization = activeSpec;

      const res = await doctorsApi.getDirectory(params);
      if (res.success) {
        setDoctors(res.doctors || []);
      }
    } catch (err) {
      console.warn('Failed to fetch doctor directory:', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Verified Medical Doctors Directory
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Directory of accredited medical practitioners authorized to participate in consent-based record sharing.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by physician name, clinical specialty, or hospital affiliation..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
      </div>

      {/* Specialization Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {SPECIALIZATIONS.map((spec) => (
          <button
            key={spec}
            onClick={() => setActiveSpec(spec)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${
              activeSpec === spec
                ? 'bg-teal-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {spec}
          </button>
        ))}
      </div>

      {/* Doctors Grid */}
      {loading ? (
        <LoadingSkeleton type="cards" count={3} />
      ) : doctors.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center">
          <Users className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-800">No verified doctors found</h3>
          <p className="text-xs text-slate-500 mt-1">Try resetting the specialty filter or adjusting search query.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map((doc) => (
            <div
              key={doc.id}
              className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 font-bold text-base shadow-sm">
                      Dr
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">Dr. {doc.name}</h3>
                      <p className="text-xs font-semibold text-teal-700">{doc.specialization}</p>
                    </div>
                  </div>
                  <Badge variant="success" size="sm">Verified</Badge>
                </div>

                <div className="space-y-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-slate-400 shrink-0" />
                    <span className="font-mono text-slate-700 font-semibold">{doc.licenseNumber}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-slate-400 shrink-0" />
                    <span className="truncate">{doc.hospitalAffiliation}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-slate-400 shrink-0" />
                    <span>{doc.experienceYears} Years Experience</span>
                  </div>
                </div>

                {doc.bio && (
                  <p className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {doc.bio}
                  </p>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-medium">
                  {doc.qualification || 'MBBS, MD'}
                </span>
                {user?.role === 'patient' && <Link
                  to={`/consent-management?doctorId=${encodeURIComponent(doc.id)}`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-semibold transition"
                >
                  <span>Share Records</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
