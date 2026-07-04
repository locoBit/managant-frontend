import { useEffect, useMemo, useState } from 'react';
import {
  Autocomplete,
  CircularProgress,
  TextField,
} from '@mui/material';
import { api } from '../../api/api.js';

// Tiny debounce hook (YAGNI: no extra deps)
function useDebouncedValue(value, delayMs) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

export function PersonSearchSelect({
  label,
  value,
  valueLabel,
  onChange,
  disabled,
  helperText,
  excludePersonId,
}) {
  const [inputValue, setInputValue] = useState('');
  const debounced = useDebouncedValue(inputValue, 250);
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState([]);
  const [error, setError] = useState('');
  const [cacheById, setCacheById] = useState({});

  useEffect(() => {
    if (!value || !valueLabel) return;
    setCacheById((prev) => ({
      ...prev,
      [value]: { id: value, label: valueLabel },
    }));
  }, [value, valueLabel]);

  const selectedOption = useMemo(() => {
    if (!value) return null;
    return (
      cacheById[value] ||
      options.find((o) => o.id === value) ||
      (valueLabel ? { id: value, label: valueLabel } : { id: value, label: value })
    );
  }, [cacheById, options, value, valueLabel]);
  useEffect(() => {
    let cancelled = false;

    async function run() {
      setError('');

      if (!debounced || debounced.trim().length < 2) {
        // Keep current options so the selected label can still render.
        // (Clearing options makes Autocomplete show only the raw id.)
        return;
      }

      setLoading(true);
      try {
        if (!cancelled && debounced.trim().length >= 2) {
          // When user starts a new search, we drop old options so results are not confusing.
          setOptions([]);
        }

        const res = await api.searchPeopleByName(debounced.trim(), { limit: 20 });
        const filtered = (res || []).filter((p) => p.id !== excludePersonId);
        if (!cancelled) {
          setOptions(filtered);
          setCacheById((prev) => {
            const next = { ...prev };
            filtered.forEach((p) => {
              next[p.id] = p;
            });
            return next;
          });
        }
      } catch (e) {
        if (!cancelled) setError(e.message || 'Error buscando personas');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [debounced, excludePersonId]);

  return (
    <Autocomplete
      disabled={disabled}
      value={selectedOption}
      onChange={(_, newValue) => {
        if (newValue) {
          setCacheById((prev) => ({ ...prev, [newValue.id]: newValue }));
          setInputValue(newValue.label || '');
          onChange(newValue.id);
          return;
        }

        setInputValue('');
        onChange('');
      }}
      inputValue={inputValue}
      onInputChange={(_, newInput) => setInputValue(newInput)}
      options={options}
      getOptionLabel={(opt) => opt?.label || ''}
      isOptionEqualToValue={(opt, val) => opt?.id === val?.id}
      loading={loading}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          margin="normal"
          helperText={error || helperText}
          error={!!error}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? (
                  <CircularProgress color="inherit" size={18} />
                ) : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
    />
  );
}
