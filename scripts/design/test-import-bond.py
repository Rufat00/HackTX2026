"""Security regression tests for untrusted ZIP imports; no source screenshots required."""
import importlib.util, stat, tempfile, unittest, zipfile
from pathlib import Path
spec=importlib.util.spec_from_file_location('bond_import',Path(__file__).with_name('import-bond.py'))
bond=importlib.util.module_from_spec(spec);spec.loader.exec_module(bond)
class ArchiveSecurityTest(unittest.TestCase):
    def test_rejects_traversal_and_absolute_paths(self):
        for path in ['../escape.png','nested/../../escape.png','/tmp/escape.png','C:\\escape.png','nested\\..\\escape.png']:
            with self.subTest(path=path),self.assertRaises(ValueError):bond.safe_member(path)
    def test_rejects_symlink_before_writing(self):
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory);archive=root/'source.zip';entry=zipfile.ZipInfo('photo.png');entry.create_system=3;entry.external_attr=(stat.S_IFLNK|0o777)<<16
            with zipfile.ZipFile(archive,'w') as zipped:zipped.writestr(entry,'/etc/passwd')
            with self.assertRaisesRegex(ValueError,'symlinks'):bond.import_archive(archive,root)
            self.assertFalse((root/'design').exists())
    def test_rejects_case_collision_before_writing(self):
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory);archive=root/'source.zip'
            with zipfile.ZipFile(archive,'w') as zipped:
                zipped.writestr('Photo.png','a');zipped.writestr('photo.png','b')
            with self.assertRaisesRegex(ValueError,'Duplicate'):bond.import_archive(archive,root)
            self.assertFalse((root/'design').exists())
if __name__=='__main__':unittest.main()
