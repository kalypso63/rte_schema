<?php
namespace MV\RteSchema\Extension;

use TYPO3\CMS\Core\Utility\GeneralUtility;
use TYPO3\CMS\Rtehtmlarea\RteHtmlAreaApi;

/***************************************************************
 *  Copyright notice
 *
 *  (c) 2015 VANCLOOSTER Mickael <vanclooster.mickael@gmail.com>
 *  All rights reserved
 *
 *  This script is part of the Typo3 project. The Typo3 project is
 *  free software; you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation; either version 2 of the License, or
 *  (at your option) any later version.
 *
 *  The GNU General Public License can be found at
 *  http://www.gnu.org/copyleft/gpl.html.
 *
 *  This script is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  This copyright notice MUST APPEAR in all copies of the script!
 ***************************************************************/
/**
 * Schema Attr plugin for htmlArea RTE
 *
 */
class SchemaAttr extends RteHtmlAreaApi {

	// The key of the extension that is extending htmlArea RTE
	protected $extensionKey = 'rte_schema';

	// The name of the plugin registered by the extension
	protected $pluginName = 'SchemaAttr';

    //plugin button
	protected $pluginButtons = 'schemaattr';

    //filename
    protected $jsonFileName = 'typo3temp/rtehtmlarea_schemaorg.js';

	protected $convertToolbarForHtmlAreaArray = array(
		'schemaattr' => 'SchemaAttr'
	);

    /**
     * Return JS configuration of the htmlArea plugins registered by the extension
     *
     * @return 	string		JS configuration for registered plugins
     */
    public function buildJavascriptConfiguration() {
        $registerRTEinJavascriptString = '';
        if(!file_exists(PATH_site . $this->jsonFileName)){
            $schema = array(
                'types' => array(),
                'properties' => array()
            );
            $fileName = 'EXT:rte_schema/Resources/Public/RDF/schema.rdfa';
            $fileName = GeneralUtility::getFileAbsFileName($fileName);
            $rdf = GeneralUtility::getUrl($fileName);
            if ($rdf)
                $this->parseSchema($rdf, $schema);

            uasort($schema['types'], array($this, 'compareLabels'));
            uasort($schema['properties'], array($this, 'compareLabels'));
            // Insert no type and no property entries
            if ($this->isFrontend()) {
                $noSchema = $GLOBALS['TSFE']->getLLL('No type', $this->LOCAL_LANG);
                $noProperty = $GLOBALS['TSFE']->getLLL('No property', $this->LOCAL_LANG);
            } else {
                $noSchema = $GLOBALS['LANG']->getLL('No type');
                $noProperty = $GLOBALS['LANG']->getLL('No property');
            }
            array_unshift($schema['types'], array('name' => 'none', 'domain' => $noSchema, 'comment' => ''));
            array_unshift($schema['properties'], array('name' => 'none', 'domain' => $noProperty, 'comment' => ''));
            GeneralUtility::writeFileToTypo3tempDir(PATH_site . $this->jsonFileName, json_encode($schema));
        }
        $output = ($this->isFrontend() && $GLOBALS['TSFE']->absRefPrefix ? $GLOBALS['TSFE']->absRefPrefix : '../') . $this->jsonFileName;
        $registerRTEinJavascriptString = 'RTEarea[editornumber].schemaUrl = "' . ($this->isFrontend() && $GLOBALS['TSFE']->absRefPrefix ? $GLOBALS['TSFE']->absRefPrefix : '') . $output . '";';
        return $registerRTEinJavascriptString;
    }

    /**
     * Compare the labels of two schema types or properties for localized sort purposes
     *
     * @param array $a: first type/property definition array
     * @param array $b: second type/property definition array
     * @return int
     */
    protected function compareLabels($a, $b) {
        return strcoll($a['name'], $b['name']);
    }

    /**
     * Convert the xml rdf schema into an array
     *
     * @param string $string XML rdf schema to convert into an array
     * @param array	$schema: reference to the array to be filled
     * @param string $available: list of schema available
     * @return void
     */
    protected function parseSchema($string, &$schema) {
        // Load the document
        $document = new \DOMDocument();
        $document->loadXML($string);
        if ($document) {
            // Scan resource descriptions
            $items = $document->getElementsByTagName('div');
            $itemsCount = $items->length;
            if($itemsCount > 0){
                foreach ($items as $item) {
                    $resource = array();
                    $type = $item->getAttribute('typeof');
                    if(!empty($type)){
                        switch ($type) {
                            //get all Schemas
                            case 'rdfs:Class':
                               $subDomains = array();
                               $resource['domain'] = trim($item->getAttribute('resource'));
                               $infos = $item->getElementsByTagName('span');
                               foreach ($infos as $info) {
                                   if($info->getAttribute('property') === 'rdfs:label')
                                       $resource['name'] = trim($info->nodeValue);
                                   if($info->getAttribute('property') === 'rdfs:comment')
                                       $resource['comment'] = strip_tags($info->nodeValue);
                                   if(trim($info->firstChild->nodeValue) === 'Subclass of:' && $info->firstChild->nextSibling->getAttribute('href'))
                                       $subDomains[] = $info->firstChild->nextSibling->getAttribute('href');
                               }
                                if(count($subDomains) > 0)
                                    $resource['subdomains'] = $subDomains;
                               if($resource['domain'] && $resource['name'])
                                    $schema['types'][] = $resource;
                            break;
                            //get all Properties
                            case 'rdf:Property':
                                $domains = array();
                                if($item->getAttribute('resource')){
                                    $infos = $item->getElementsByTagName('span');
                                    foreach ($infos as $info) {
                                        if($info->getAttribute('property') === 'rdfs:label')
                                            $resource['name'] = trim($info->nodeValue);
                                        if($info->getAttribute('property') === 'rdfs:comment')
                                            $resource['comment'] = strip_tags($info->nodeValue);
                                        if(trim($info->firstChild->nodeValue) === 'Domain:' && $info->firstChild->nextSibling->getAttribute('href'))
                                            $domains[] = $info->firstChild->nextSibling->getAttribute('href');
                                    }
                                    if(count($domains) > 0)
                                        $resource['domains'] = $domains;
                                    if($resource['domains'] && $resource['name'])
                                        $schema['properties'][] = $resource;
                                }
                            break;
                        }
                    }
                }
            }
        }
    }

}
