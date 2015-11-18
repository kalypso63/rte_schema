<?php
if (!defined('TYPO3_MODE')) die('Access denied.');

//Default TS Config
\TYPO3\CMS\Core\Utility\ExtensionManagementUtility::registerPageTSConfigFile(
    'rte_schema',
    'Configuration/TsConfig/rte.ts',
    'Default configuration'
);

if (TYPO3_MODE == "BE")   {
    $GLOBALS['TBE_STYLES']['skins'][$_EXTKEY]['name'] = $_EXTKEY;
    $GLOBALS['TBE_STYLES']['skins'][$_EXTKEY]['stylesheetDirectories']['css'] = 'EXT:rte_schema/Resources/Public/Css/';
}