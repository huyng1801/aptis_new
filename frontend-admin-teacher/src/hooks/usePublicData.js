'use client';

import { useState, useEffect } from 'react';
import { publicApi } from '@/services/publicService';

export const usePublicData = () => {
  const [aptisTypes, setAptisTypes] = useState([]);
  const [skillTypes, setSkillTypes] = useState([]);
  const [questionTypes, setQuestionTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadPublicData = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('[usePublicData] Starting to load public data...');
        
        const [aptisResponse, skillsResponse, questionsResponse] = await Promise.all([
          publicApi.getAptisTypes().catch(err => {
            console.error('[usePublicData] Failed to load APTIS types:', err);
            return null;
          }),
          publicApi.getSkillTypes().catch(err => {
            console.error('[usePublicData] Failed to load Skill types:', err);
            return null;
          }),
          publicApi.getQuestionTypes().catch(err => {
            console.error('[usePublicData] Failed to load Question types:', err);
            return null;
          })
        ]);

        console.log('[usePublicData] APTIS Response:', aptisResponse);
        console.log('[usePublicData] Skills Response:', skillsResponse);
        console.log('[usePublicData] Questions Response:', questionsResponse);

        // Handle APTIS Types
        if (aptisResponse) {
          const aptisData = aptisResponse.success ? aptisResponse.data : aptisResponse.data || aptisResponse;
          if (Array.isArray(aptisData)) {
            // Transform to ensure consistency - backend returns 'name', we normalize to 'aptis_type_name'
            const normalized = aptisData.map(item => ({
              ...item,
              id: item.id,
              aptis_type_name: item.aptis_type_name || item.name,
              aptis_type_code: item.code || item.aptis_type_code,
              description: item.description
            }));
            console.log('[usePublicData] Normalized APTIS types:', normalized);
            setAptisTypes(normalized);
          } else {
            console.warn('[usePublicData] APTIS data is not an array:', aptisData);
            setAptisTypes([]);
          }
        } else {
          console.warn('[usePublicData] No APTIS response received');
          setAptisTypes([]);
        }
        
        // Handle Skill Types
        if (skillsResponse) {
          const skillsData = skillsResponse.success ? skillsResponse.data : skillsResponse.data || skillsResponse;
          if (Array.isArray(skillsData)) {
            // Transform to ensure consistency - backend returns 'name', we normalize to 'skill_type_name'
            const normalized = skillsData.map(item => ({
              ...item,
              id: item.id,
              skill_type_name: item.skill_type_name || item.name,
              skill_type_code: item.code || item.skill_type_code,
              description: item.description
            }));
            console.log('[usePublicData] Normalized skill types:', normalized);
            setSkillTypes(normalized);
          } else {
            console.warn('[usePublicData] Skills data is not an array:', skillsData);
            setSkillTypes([]);
          }
        } else {
          console.warn('[usePublicData] No Skills response received');
          setSkillTypes([]);
        }

        // Handle Question Types
        if (questionsResponse) {
          const questionsData = questionsResponse.success ? questionsResponse.data : questionsResponse.data || questionsResponse;
          if (Array.isArray(questionsData)) {
            console.log('[usePublicData] Setting question types:', questionsData);
            setQuestionTypes(questionsData);
          } else {
            console.warn('[usePublicData] Questions data is not an array:', questionsData);
            setQuestionTypes([]);
          }
        } else {
          console.warn('[usePublicData] No Questions response received');
          setQuestionTypes([]);
        }

        // Check if all required data is loaded
        if (!aptisResponse || !skillsResponse) {
          setError('Không thể tải đầy đủ dữ liệu. Vui lòng kiểm tra kết nối mạng và thử lại.');
        }
      } catch (err) {
        console.error('[usePublicData] Error loading public data:', err);
        setError(err.message || 'Không thể tải dữ liệu. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    };

    loadPublicData();
  }, []);

  return {
    aptisTypes,
    skillTypes,
    questionTypes,
    loading,
    error
  };
};