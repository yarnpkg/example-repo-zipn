import {VirtualFS}                            from '../sources/VirtualFS';
import {Filename, npath, ppath, PortablePath} from '../sources/path';
import {CwdFS, xfs}                           from '../sources';

describe(`VirtualFS`, () => {
  it(`should ignore non-hash virtual components`, () => {
    const virtualPath = ppath.join(npath.toPortablePath(__dirname), Filename.virtual);
    const virtualEntry = ppath.join(virtualPath, `package.json`);

    const expected = virtualEntry;

    const virtualFs = new VirtualFS();
    expect(virtualFs.mapToBase(virtualEntry)).toEqual(expected);
  });

  it(`shouldn't map non-number virtual components`, () => {
    const virtualPath = ppath.join(npath.toPortablePath(__dirname), Filename.virtual);
    const virtualEntry = ppath.join(virtualPath, `12345/invalid`);

    const expected = virtualEntry;

    const virtualFs = new VirtualFS();
    expect(virtualFs.mapToBase(virtualEntry)).toEqual(expected);
  });

  it(`should map numbered virtual components (0, no file)`, () => {
    const virtualPath = ppath.join(npath.toPortablePath(__dirname), Filename.virtual);
    const virtualEntry = ppath.join(virtualPath, `12345/0`);

    const expected = ppath.join(virtualPath, `..`);

    const virtualFs = new VirtualFS();
    expect(virtualFs.mapToBase(virtualEntry)).toEqual(expected);
  });

  it(`should map numbered virtual components (0, w/ file)`, () => {
    const virtualPath = ppath.join(npath.toPortablePath(__dirname), Filename.virtual);
    const virtualEntry = ppath.join(virtualPath, `12345/0/foobar`);

    const expected = ppath.join(virtualPath, `../foobar`);

    const virtualFs = new VirtualFS();
    expect(virtualFs.mapToBase(virtualEntry)).toEqual(expected);
  });

  it(`should map numbered virtual components (1, no file)`, () => {
    const virtualPath = ppath.join(npath.toPortablePath(__dirname), Filename.virtual);
    const virtualEntry = ppath.join(virtualPath, `12345/1`);

    const expected = ppath.join(virtualPath, `../..`);

    const virtualFs = new VirtualFS();
    expect(virtualFs.mapToBase(virtualEntry)).toEqual(expected);
  });

  it(`should map numbered virtual components (1, w/ file)`, () => {
    const virtualPath = ppath.join(npath.toPortablePath(__dirname), Filename.virtual);
    const virtualEntry = ppath.join(virtualPath, `12345/1/foobar`);

    const expected = ppath.join(virtualPath, `../../foobar`);

    const virtualFs = new VirtualFS();
    expect(virtualFs.mapToBase(virtualEntry)).toEqual(expected);
  });

  it(`should preserve dots when mapping`, () => {
    const virtualFs = new VirtualFS();
    expect(virtualFs.mapToBase(PortablePath.dot)).toEqual(PortablePath.dot);
  });

  it(`should preserve empty strings when mapping`, () => {
    const virtualFs = new VirtualFS();
    expect(virtualFs.mapToBase(`` as PortablePath)).toEqual(``);
  });

  it(`should allow access to a directory through its virtual subfolder`, () => {
    const virtualPath = ppath.join(npath.toPortablePath(__dirname), Filename.virtual);

    const virtualFs = new VirtualFS();
    expect(virtualFs.readdirSync(virtualPath)).toContain(`VirtualFS.test.ts`);
  });

  it(`should allow access to a directory through its virtual components`, () => {
    const virtualPath = ppath.join(npath.toPortablePath(__dirname), Filename.virtual);
    const virtualEntry = ppath.join(virtualPath, `12345`);

    const virtualFs = new VirtualFS();
    expect(virtualFs.readdirSync(virtualEntry)).toContain(`VirtualFS.test.ts`);
  });

  it(`should allow access to a directory through its depth marker`, () => {
    const virtualPath = ppath.join(npath.toPortablePath(__dirname), Filename.virtual);
    const virtualEntry = ppath.join(virtualPath, `12345` as Filename, `0`);

    const virtualFs = new VirtualFS();
    expect(virtualFs.readdirSync(virtualEntry)).toContain(`VirtualFS.test.ts`);
  });

  it(`should allow access to a directory parent through its depth marker`, () => {
    const virtualPath = ppath.join(npath.toPortablePath(__dirname), Filename.virtual);
    const virtualEntry = ppath.join(virtualPath, `12345` as Filename, `1`);

    const virtualFs = new VirtualFS();
    expect(virtualFs.readdirSync(virtualEntry)).toContain(`package.json`);
  });

  it(`should allow reading a file through its virtual path (depth=0)`, () => {
    const virtualPath = ppath.join(npath.toPortablePath(__dirname), Filename.virtual);
    const virtualEntry = ppath.join(virtualPath, `12345` as Filename, `0`);

    const virtualFs = new VirtualFS();

    const virtualContent = virtualFs.readFileSync(ppath.join(virtualEntry, `VirtualFS.test.ts`));
    const physicalContent = xfs.readFileSync(ppath.join(ppath.dirname(virtualPath), `VirtualFS.test.ts`));

    expect(virtualContent).toEqual(physicalContent);
  });

  it(`should allow reading a file through its virtual path (depth=1)`, () => {
    const virtualPath = ppath.join(npath.toPortablePath(__dirname), Filename.virtual);
    const virtualEntry = ppath.join(virtualPath, `12345` as Filename, `1`);

    const virtualFs = new VirtualFS();

    const virtualContent = virtualFs.readFileSync(ppath.join(virtualEntry, `package.json`));
    const physicalContent = xfs.readFileSync(ppath.join(ppath.dirname(ppath.dirname(virtualPath)), `package.json`));

    expect(virtualContent).toEqual(physicalContent);
  });

  it(`should allow accessing virtual files through relative urls`, () => {
    const virtualPath = ppath.join(npath.toPortablePath(__dirname), Filename.virtual);
    const virtualEntry = ppath.join(virtualPath, `12345` as Filename, `1`);

    const virtualFs = new VirtualFS();

    const virtualContent = virtualFs.readFileSync(ppath.relative(ppath.cwd(), ppath.join(virtualEntry, `package.json`)));
    const physicalContent = xfs.readFileSync(ppath.join(ppath.dirname(ppath.dirname(virtualPath)), `package.json`));

    expect(virtualContent).toEqual(physicalContent);
  });

  it(`should preserve the virtual path across realpath (virtual directory)`, () => {
    const virtualPath = ppath.join(npath.toPortablePath(__dirname), Filename.virtual);

    const virtualFs = new VirtualFS();
    expect(virtualFs.realpathSync(virtualPath)).toEqual(virtualPath);
  });

  it(`should preserve the virtual path across realpath (virtual component)`, () => {
    const virtualPath = ppath.join(npath.toPortablePath(__dirname), Filename.virtual);
    const virtualEntry = ppath.join(virtualPath, `12345`);

    const virtualFs = new VirtualFS();
    expect(virtualFs.realpathSync(virtualEntry)).toEqual(virtualEntry);
  });

  it(`should preserve the virtual path across realpath (depth marker)`, () => {
    const virtualPath = ppath.join(npath.toPortablePath(__dirname), Filename.virtual);
    const virtualEntry = ppath.join(virtualPath, `12345` as Filename, `0`);

    const virtualFs = new VirtualFS();
    expect(virtualFs.realpathSync(virtualEntry)).toEqual(virtualEntry);
  });

  it(`should preserve the virtual path across realpath (virtual file)`, () => {
    const virtualPath = ppath.join(npath.toPortablePath(__dirname), Filename.virtual);
    const virtualEntry = ppath.join(virtualPath, `12345` as Filename, `0` as Filename, `VirtualFS.test.ts`);

    const virtualFs = new VirtualFS();
    expect(virtualFs.realpathSync(virtualEntry)).toEqual(virtualEntry);
  });

  it(`should work when the path is a dot`, () => {
    const virtualFs = new VirtualFS({baseFs: new CwdFS(npath.toPortablePath(__dirname))});

    expect(virtualFs.readdirSync(PortablePath.dot)).toContain(`VirtualFS.test.ts`);
  });

  it(`should throw when the path is an empty string`, () => {
    const virtualFs = new VirtualFS();

    expect(() => virtualFs.readdirSync(`` as PortablePath)).toThrow(`ENOENT`);
  });
});
