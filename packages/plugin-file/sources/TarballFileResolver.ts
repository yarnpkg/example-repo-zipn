import {Resolver, ResolveOptions, MinimalResolveOptions, Package, hashUtils} from '@yarnpkg/core';
import {Descriptor, Locator, Manifest}                                       from '@yarnpkg/core';
import {LinkType}                                                            from '@yarnpkg/core';
import {miscUtils, structUtils}                                              from '@yarnpkg/core';

import {FILE_REGEXP, TARBALL_REGEXP, PROTOCOL}                               from './constants';
import * as fileUtils                                                        from './fileUtils';

export class TarballFileResolver implements Resolver {
  supportsDescriptor(descriptor: Descriptor, opts: MinimalResolveOptions) {
    if (!TARBALL_REGEXP.test(descriptor.range))
      return false;

    if (descriptor.range.startsWith(PROTOCOL))
      return true;

    if (FILE_REGEXP.test(descriptor.range))
      return true;

    return false;
  }

  supportsLocator(locator: Locator, opts: MinimalResolveOptions) {
    if (!TARBALL_REGEXP.test(locator.reference))
      return false;

    if (locator.reference.startsWith(PROTOCOL))
      return true;

    return false;
  }

  shouldPersistResolution(locator: Locator, opts: MinimalResolveOptions) {
    return false;
  }

  bindDescriptor(descriptor: Descriptor, fromLocator: Locator, opts: MinimalResolveOptions) {
    if (FILE_REGEXP.test(descriptor.range))
      descriptor = structUtils.makeDescriptor(descriptor, `${PROTOCOL}${descriptor.range}`);

    return structUtils.bindDescriptor(descriptor, {
      locator: structUtils.stringifyLocator(fromLocator),
    });
  }

  getResolutionDependencies(descriptor: Descriptor, opts: MinimalResolveOptions) {
    return {};
  }

  async getCandidates(descriptor: Descriptor, dependencies: unknown, opts: ResolveOptions) {
    if (!opts.fetchOptions)
      throw new Error(`Assertion failed: This resolver cannot be used unless a fetcher is configured`);

    const {path, parentLocator} = fileUtils.parseSpec(descriptor.range);
    if (parentLocator === null)
      throw new Error(`Assertion failed: The descriptor should have been bound`);

    const temporaryLocator = fileUtils.makeLocator(descriptor, {parentLocator, path, hash: ``, protocol: PROTOCOL});
    const buffer = await fileUtils.fetchArchiveFromLocator(temporaryLocator, opts.fetchOptions);
    const hash = hashUtils.makeHash(buffer).slice(0, 6);

    return [fileUtils.makeLocator(descriptor, {parentLocator, path, hash, protocol: PROTOCOL})];
  }

  async getSatisfying(descriptor: Descriptor, dependencies: Record<string, Package>, locators: Array<Locator>, opts: ResolveOptions) {
    const [locator] = await this.getCandidates(descriptor, dependencies, opts);

    return {
      locators: locators.filter(candidate => candidate.locatorHash === locator.locatorHash),
      sorted: false,
    };
  }

  async resolve(locator: Locator, opts: ResolveOptions) {
    if (!opts.fetchOptions)
      throw new Error(`Assertion failed: This resolver cannot be used unless a fetcher is configured`);

    const packageFetch = await opts.fetchOptions.fetcher.fetch(locator, opts.fetchOptions);

    const manifest = await miscUtils.releaseAfterUseAsync(async () => {
      return await Manifest.find(packageFetch.prefixPath, {baseFs: packageFetch.packageFs});
    }, packageFetch.releaseFs);

    return {
      ...locator,

      version: manifest.version || `0.0.0`,

      languageName: manifest.languageName || opts.project.configuration.get(`defaultLanguageName`),
      linkType: LinkType.HARD,

      conditions: manifest.getConditions(),

      dependencies: opts.project.configuration.normalizeDependencyMap(manifest.dependencies),
      peerDependencies: manifest.peerDependencies,

      dependenciesMeta: manifest.dependenciesMeta,
      peerDependenciesMeta: manifest.peerDependenciesMeta,

      bin: manifest.bin,
    };
  }
}
