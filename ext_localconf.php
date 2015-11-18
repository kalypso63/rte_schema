<?php
if (!defined ('TYPO3_MODE')) die ('Access denied.');


$GLOBALS['TYPO3_CONF_VARS']['EXTCONF']['rtehtmlarea']['plugins']['SchemaAttr'] = array();
$GLOBALS['TYPO3_CONF_VARS']['EXTCONF']['rtehtmlarea']['plugins']['SchemaAttr']['objectReference'] = \MV\RteSchema\Extension\SchemaAttr::class;
$GLOBALS['TYPO3_CONF_VARS']['EXTCONF']['rtehtmlarea']['plugins']['SchemaAttr']['disableInFE'] = 0;