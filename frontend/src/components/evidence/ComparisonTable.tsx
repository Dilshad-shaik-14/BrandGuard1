import React from 'react';
import { AssetKind, CandidateEntity } from '../../types/brandguard';
import { CharDiff } from './CharDiff';
import { compareFieldValues } from '../../lib/compareFields';

interface ComparisonTableProps {
  kind: AssetKind;
  official: CandidateEntity;
  candidate: CandidateEntity;
  className?: string;
}

export const ComparisonTable: React.FC<ComparisonTableProps> = ({
  kind,
  official,
  candidate,
  className = '',
}) => {
  const isSocial = kind === 'social';

  const rows = isSocial
    ? [
        {
          label: 'Name',
          officialVal: official.name,
          candidateVal: candidate.name,
          useDiff: true,
          isMono: false,
          isExact: false,
        },
        {
          label: 'Handle',
          officialVal: official.handle_or_package,
          candidateVal: candidate.handle_or_package,
          useDiff: true,
          isMono: true,
          isExact: true,
        },
        {
          label: 'Account ID',
          officialVal: official.external_id || 'Not registered',
          candidateVal: candidate.external_id || 'None',
          useDiff: false,
          isMono: true,
          isExact: true,
        },
        {
          label: 'Bio',
          officialVal: official.bio_or_desc || '',
          candidateVal: candidate.bio_or_desc || '',
          useDiff: false,
          isMono: false,
          isExact: false,
        },
      ]
    : [
        {
          label: 'App name',
          officialVal: official.name,
          candidateVal: candidate.name,
          useDiff: true,
          isMono: false,
          isExact: false,
        },
        {
          label: 'Package ID',
          officialVal: official.handle_or_package,
          candidateVal: candidate.handle_or_package,
          useDiff: true,
          isMono: true,
          isExact: true,
        },
        {
          label: 'Publisher',
          officialVal: official.publisher || '',
          candidateVal: candidate.publisher || '',
          useDiff: true,
          isMono: false,
          isExact: false,
        },
        {
          label: 'Description',
          officialVal: official.bio_or_desc || '',
          candidateVal: candidate.bio_or_desc || '',
          useDiff: false,
          isMono: false,
          isExact: false,
        },
      ];

  return (
    <div className={`overflow-x-auto rounded-[8px] border border-[var(--line-strong)] bg-[#070D14] ${className}`}>
      <table className="w-full text-left text-[12.5px] border-collapse">
        <thead>
          <tr className="bg-[var(--bg-surface-inset)] border-b border-[var(--line-strong)] text-[11px] font-mono-code text-[var(--text-muted)] uppercase">
            <th className="py-2.5 px-3.5 font-semibold w-1/4">Forensic Field</th>
            <th className="py-2.5 px-3.5 font-semibold w-1/3">Official Baseline</th>
            <th className="py-2.5 px-3.5 font-semibold w-1/3">Questioned Candidate</th>
            <th className="py-2.5 px-3.5 font-semibold w-24 text-right">Match</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--line-subtle)]">
          {rows.map((row) => {
            const comparison = compareFieldValues(row.officialVal, row.candidateVal, row.isExact);

            let resultBadgeClass = 'bg-[var(--bg-surface-elevated)] text-[var(--text-muted)] border border-[var(--line-subtle)]';
            if (comparison === 'Same') {
              resultBadgeClass = 'bg-[var(--official-bg)] text-[var(--official)] border border-[var(--official-border)]';
            } else if (comparison === 'Similar') {
              resultBadgeClass = 'bg-[var(--med-bg)] text-[var(--med)] border border-[var(--med-border)]';
            } else if (comparison === 'Differs') {
              resultBadgeClass = 'bg-[var(--high-bg)] text-[var(--high)] border border-[var(--high-border)]';
            }

            return (
              <tr key={row.label} className="hover:bg-[var(--bg-surface-elevated)] transition-colors">
                <td className="py-2.5 px-3.5 font-medium text-white font-mono-code text-[11.5px]">
                  {row.label}
                </td>

                <td className="py-2.5 px-3.5 text-[var(--text-secondary)]">
                  {row.officialVal ? (
                    <span className={row.isMono ? 'font-mono-code text-[11.5px]' : ''}>
                      {row.officialVal}
                    </span>
                  ) : (
                    <span className="text-[var(--text-muted)] italic text-[11px]">Not provided</span>
                  )}
                </td>

                <td className="py-2.5 px-3.5 text-white">
                  {row.candidateVal ? (
                    row.useDiff && row.officialVal ? (
                      <CharDiff
                        official={row.officialVal}
                        candidate={row.candidateVal}
                        isMono={row.isMono}
                        showAnnotations={true}
                      />
                    ) : (
                      <span className={row.isMono ? 'font-mono-code text-[11.5px]' : ''}>
                        {row.candidateVal}
                      </span>
                    )
                  ) : (
                    <span className="text-[var(--text-muted)] italic text-[11px]">Not provided</span>
                  )}
                </td>

                <td className="py-2.5 px-3.5 text-right font-mono-code">
                  <span className={`inline-block px-2 py-0.5 rounded-[3px] text-[10.5px] font-bold ${resultBadgeClass}`}>
                    {comparison}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
