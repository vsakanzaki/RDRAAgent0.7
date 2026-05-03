const fs = require('fs');
const path = require('path');

/**
 * メニュー99で削除する成果物のルート（配下を再帰的にすべて削除）
 */
const artifactRoots = ['0_RDRAZeroOne', '1_RDRA', '2_RDRASpec', '3_RDRASdd'];

/**
 * スクリプト配置からプロジェクトルート（初期要望.txt があるディレクトリ）を推定
 */
function findProjectRootFromScript() {
    let dir = path.resolve(__dirname, '..', '..');
    const { root } = path.parse(dir);
    while (true) {
        if (fs.existsSync(path.join(dir, '初期要望.txt'))) {
            return dir;
        }
        if (dir === root) {
            return process.cwd();
        }
        dir = path.dirname(dir);
    }
}

/**
 * ディレクトリ配下のファイルを再帰的に削除する（ディレクトリ自体は残す）
 * @param {string} dirPath - 対象ディレクトリの絶対パス
 */
function clearDirectoryContentsRecursive(dirPath) {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
        const full = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
            fs.rmSync(full, { recursive: true, force: true });
        } else {
            fs.unlinkSync(full);
        }
    }
}

/**
 * メニュー99用: 生成成果物のルートフォルダ配下を再帰削除（フォルダ自体は残す）
 * @param {string} projectRoot - プロジェクトルートの絶対パス
 */
function deleteAllArtifacts(projectRoot) {
    for (const rel of artifactRoots) {
        const full = path.join(projectRoot, ...rel.split('/'));
        if (!fs.existsSync(full)) {
            console.log(`パスが存在しません（スキップ）: ${rel}`);
            continue;
        }
        clearDirectoryContentsRecursive(full);
        console.log(`削除完了（フォルダは保持）: ${rel}`);
    }
}

/**
 * 相対パスで指定したディレクトリ配下を再帰削除（フォルダ自体は残す）
 * @param {string} folderPath - プロジェクトルートからの相対パス（例: 0_RDRAZeroOne/phase1）
 * @param {string} [projectRoot] - 省略時は folderPath を cwd 基準で解決（非推奨）
 */
function deleteFilesInFolder(folderPath, projectRoot) {
    try {
        const full = projectRoot
            ? path.join(projectRoot, ...folderPath.replace(/\\/g, '/').split('/').filter(Boolean))
            : path.resolve(folderPath);

        if (!fs.existsSync(full)) {
            console.log(`パスが存在しません: ${folderPath}`);
            return;
        }
        clearDirectoryContentsRecursive(full);
        console.log(`削除完了（フォルダは保持）: ${folderPath}`);
    } catch (error) {
        console.error(`削除エラー: ${folderPath} - ${error.message}`);
    }
}

/**
 * 相対パスで指定したフォルダー自体を再帰削除する
 * @param {string} folderPath - プロジェクトルートからの相対パス
 * @param {string} [projectRoot] - 省略時は folderPath を cwd 基準で解決
 */
function deleteFolderRecursive(folderPath, projectRoot) {
    try {
        const full = projectRoot
            ? path.join(projectRoot, ...folderPath.replace(/\\/g, '/').split('/').filter(Boolean))
            : path.resolve(folderPath);

        if (!fs.existsSync(full)) {
            console.log(`パスが存在しません（スキップ）: ${folderPath}`);
            return;
        }
        fs.rmSync(full, { recursive: true, force: true });
        console.log(`フォルダー削除完了: ${folderPath}`);
    } catch (error) {
        console.error(`フォルダー削除エラー: ${folderPath} - ${error.message}`);
    }
}

function deleteSpecificFile(filePath) {
    try {
        if (!fs.existsSync(filePath)) {
            console.log(`ファイルが存在しません: ${filePath}`);
            return false;
        }
        const stats = fs.statSync(filePath);
        if (!stats.isFile()) {
            console.log(`指定されたパスはファイルではありません: ${filePath}`);
            return false;
        }
        fs.unlinkSync(filePath);
        console.log(`ファイル削除完了: ${filePath}`);
        return true;
    } catch (error) {
        console.error(`ファイル削除エラー: ${filePath} - ${error.message}`);
        return false;
    }
}

function deleteSpecificFiles(filePaths) {
    console.log('\n=== 特定ファイルの削除開始 ===');
    let successCount = 0;
    let failCount = 0;
    filePaths.forEach((filePath) => {
        if (deleteSpecificFile(filePath)) {
            successCount++;
        } else {
            failCount++;
        }
    });
    console.log('=== 特定ファイルの削除完了 ===');
    console.log(`成功: ${successCount}件, 失敗: ${failCount}件`);
}

function main() {
    const projectRoot = findProjectRootFromScript();
    console.log(`ファイル削除プログラムを開始します... (プロジェクトルート: ${projectRoot})\n`);

    deleteAllArtifacts(projectRoot);

    console.log('\nすべての削除処理が完了しました。');
}

if (require.main === module) {
    main();
}

module.exports = {
    deleteFilesInFolder,
    deleteFolderRecursive,
    deleteAllArtifacts,
    deleteSpecificFile,
    deleteSpecificFiles,
    findProjectRootFromScript,
    artifactRoots
};
