import { mkdir, writeFile, rm, readdir, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { extract } from 'tar';
import { api } from './api.js';
import { getConfig, addInstalledSkill, removeInstalledSkill, getInstalledSkill } from './config.js';
import { getSkillPath, getTempPath } from './paths.js';
import type { InstalledSkill, DownloadResponse } from '../types.js';

export interface InstallResult {
  success: boolean;
  name: string;
  version: string;
  path: string;
  error?: string;
}

export async function installSkill(
  name: string,
  version: string = 'latest',
  options?: { force?: boolean }
): Promise<InstallResult> {
  const config = getConfig();
  const skillPath = getSkillPath(name);

  // Check if already installed
  const existing = getInstalledSkill(name);
  if (existing && !options?.force) {
    if (version === 'latest' || existing.version === version) {
      return {
        success: false,
        name,
        version: existing.version,
        path: existing.path,
        error: `${name}@${existing.version} is already installed. Use --force to reinstall.`
      };
    }
  }

  // Fetch download info
  const downloadResponse = await api.downloadSkill(name, version);

  if (downloadResponse.error || !downloadResponse.data) {
    return {
      success: false,
      name,
      version,
      path: skillPath,
      error: downloadResponse.message || `Failed to fetch skill: ${name}`
    };
  }

  const downloadData = downloadResponse.data as DownloadResponse;
  const actualVersion = downloadData.version;

  // Create skill directory
  await mkdir(skillPath, { recursive: true });

  // If there's a tarball, download and extract it
  if (downloadData.tarball_url) {
    const tarball = await api.getTarball(name, actualVersion);
    if (tarball) {
      const tempPath = getTempPath();
      await mkdir(tempPath, { recursive: true });

      const tarballPath = join(tempPath, `${name}-${actualVersion}.tar.gz`);
      await writeFile(tarballPath, Buffer.from(tarball));

      // Extract tarball
      await extract({
        file: tarballPath,
        cwd: skillPath,
        strip: 1 // Remove top-level directory from tarball
      });

      // Clean up
      await rm(tarballPath, { force: true });
    }
  }

  // Write SKILL.md if provided
  if (downloadData.skill_md) {
    await writeFile(join(skillPath, 'SKILL.md'), downloadData.skill_md);
  }

  // Write README.md if provided
  if (downloadData.readme) {
    await writeFile(join(skillPath, 'README.md'), downloadData.readme);
  }

  // Write config schema if provided
  if (downloadData.config_schema) {
    await writeFile(
      join(skillPath, 'config.schema.json'),
      JSON.stringify(downloadData.config_schema, null, 2)
    );
  }

  // Record installation
  const installedSkill: InstalledSkill = {
    name,
    version: actualVersion,
    path: skillPath,
    installedAt: new Date().toISOString(),
    source: 'registry'
  };

  addInstalledSkill(installedSkill);

  return {
    success: true,
    name,
    version: actualVersion,
    path: skillPath
  };
}

export async function removeSkill(name: string): Promise<{ success: boolean; error?: string }> {
  const existing = getInstalledSkill(name);

  if (!existing) {
    return { success: false, error: `Skill '${name}' is not installed` };
  }

  // Remove directory
  if (existsSync(existing.path)) {
    await rm(existing.path, { recursive: true, force: true });
  }

  // Remove from installed list
  removeInstalledSkill(name);

  return { success: true };
}

export async function updateSkill(name: string): Promise<InstallResult> {
  const existing = getInstalledSkill(name);

  if (!existing) {
    return {
      success: false,
      name,
      version: '',
      path: '',
      error: `Skill '${name}' is not installed`
    };
  }

  // Get latest version info
  const skillResponse = await api.getSkill(name);
  if (skillResponse.error || !skillResponse.data) {
    return {
      success: false,
      name,
      version: existing.version,
      path: existing.path,
      error: skillResponse.message || `Failed to fetch skill info`
    };
  }

  const latestVersion = skillResponse.data.latest_version;

  if (!latestVersion) {
    return {
      success: false,
      name,
      version: existing.version,
      path: existing.path,
      error: 'No versions available'
    };
  }

  if (existing.version === latestVersion) {
    return {
      success: true,
      name,
      version: existing.version,
      path: existing.path,
      error: 'Already at latest version'
    };
  }

  // Install new version
  return installSkill(name, 'latest', { force: true });
}

export async function installFromLocal(
  sourcePath: string,
  name?: string
): Promise<InstallResult> {
  // Check for SKILL.md
  const skillMdPath = join(sourcePath, 'SKILL.md');
  if (!existsSync(skillMdPath)) {
    return {
      success: false,
      name: name || 'unknown',
      version: 'local',
      path: sourcePath,
      error: 'No SKILL.md found in source directory'
    };
  }

  // Read SKILL.md to get name if not provided
  const skillMd = await readFile(skillMdPath, 'utf-8');
  const nameMatch = skillMd.match(/^#\s*(.+)$/m);
  const skillName = name || nameMatch?.[1]?.toLowerCase().replace(/\s+/g, '-') || 'local-skill';

  const config = getConfig();
  const skillPath = getSkillPath(skillName);

  // Create skill directory
  await mkdir(skillPath, { recursive: true });

  // Copy all files
  const files = await readdir(sourcePath, { withFileTypes: true });
  for (const file of files) {
    const srcPath = join(sourcePath, file.name);
    const destPath = join(skillPath, file.name);

    if (file.isDirectory()) {
      await mkdir(destPath, { recursive: true });
      // Recursively copy directory (simplified)
      const subFiles = await readdir(srcPath);
      for (const subFile of subFiles) {
        const content = await readFile(join(srcPath, subFile));
        await writeFile(join(destPath, subFile), content);
      }
    } else {
      const content = await readFile(srcPath);
      await writeFile(destPath, content);
    }
  }

  // Record installation
  const installedSkill: InstalledSkill = {
    name: skillName,
    version: 'local',
    path: skillPath,
    installedAt: new Date().toISOString(),
    source: 'local'
  };

  addInstalledSkill(installedSkill);

  return {
    success: true,
    name: skillName,
    version: 'local',
    path: skillPath
  };
}

export async function verifySkill(path: string): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = [];

  // Check for SKILL.md
  const skillMdPath = join(path, 'SKILL.md');
  if (!existsSync(skillMdPath)) {
    errors.push('Missing SKILL.md file');
  } else {
    const content = await readFile(skillMdPath, 'utf-8');
    if (content.length < 50) {
      errors.push('SKILL.md is too short (minimum 50 characters)');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
