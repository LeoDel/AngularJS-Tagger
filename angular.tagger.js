/**
 * Created by:  Leonardo Delcastanher
 * Date:        19/10/2016
 * Version:     v1.2.2
 */

angular.module('AngularTagger', []).service('angularTaggerService', function ($http, $rootScope, $log) {
    var _lsTagList = "ls_tag_list";
    var _lsTagLibrary = "ls_current_library";
    var updateTagList = [];
    var tagListUrl = '';
    $rootScope.tagList = {};
    $rootScope.currentLibrary = '';

    function initiateAngularTagger(url, tagLibrary) {
        $log.debug("initiateAngularTagger(" + url + ", " + tagLibrary + ")", "");
        setListUrl(url);
        startLocalStorage();
        setCurrentTagLibrary(tagLibrary);
    }

    function setListUrl(url) {
        $log.debug("setListUrl(" + url + ")", "");
        tagListUrl = url;
    }

    function setCurrentTagLibrary(tagLibrary) {
        log("setCurrentTagLibrary(" + tagLibrary + ")", "");
        $rootScope.currentLibrary = tagLibrary;
        store(_lsTagLibrary, $rootScope.currentLibrary);
    }

    function addTagLibrary(tagLibrary) {
        $log.debug("addTagLibrary(" + tagLibrary + ")", "");
        if (!doesTagLibraryExist(tagLibrary)) {
            $log.debug("addTagLibrary(" + tagLibrary + ")", "Adding tagLibrary!");
            $rootScope.tagList[tagLibrary] = {
                version: new Date(0),
                tags: {}
            };
            store(_lsTagList, $rootScope.tagList);
        }
    }

    function addTagToTagList(tag) {
        $log.debug("addTagToTagList(" + tag + ")", "");
        addTagLibrary($rootScope.currentLibrary);
        addTagToTagLibrary(tag, $rootScope.currentLibrary);
        if (doesTagExist($rootScope.currentLibrary, tag)) {
            if ($rootScope.tagList[$rootScope.currentLibrary].tags[tag] != tag) {
                return true;
            }
        }
        updateTag(tag, $rootScope.currentLibrary);
    }

    function doesTagLibraryExist(tagLibrary) {
        $log.debug("doesTagLibraryExist(" + tagLibrary + ")", "");
        $log.debug("doesTagLibraryExist(" + tagLibrary + ")", $rootScope.tagList.hasOwnProperty(tagLibrary));
        return $rootScope.tagList.hasOwnProperty(tagLibrary);
    }

    function doesTagExist(tagLibrary, tag) {
        $log.debug("doesTagExist(" + tagLibrary + ", " + tag + ")", "");
        if (doesTagLibraryExist(tagLibrary)) {
            return $rootScope.tagList[tagLibrary].tags.hasOwnProperty(tag);
        }
    }

    function addTagToTagLibrary(tag, tagLibrary) {
        $log.debug("addTagToTagLibrary(" + tag + "," + tagLibrary + ")", "");
        addTagLibrary(tagLibrary);
        if (!doesTagExist(tagLibrary, tag)) {
            $log.debug("addTagToTagLibrary(" + tag + "," + tagLibrary + ")", "Creating tag");
            $rootScope.tagList[tagLibrary].tags[tag] = tag;
            store(_lsTagList, $rootScope.tagList);
        }
    }

    function updateTag(tag, tagLibrary) {
        $log.debug("updateTag(" + tag + "," + tagLibrary + ")", "");

        var data = {
            "Tags": [tag],
            "Language": tagLibrary
        };
        $http({
            method: 'POST',
            url: tagListUrl + '/Translate',
            data: data
        }).then(function (result) {
            if (result.status >= 200) {
                $log.debug("updateTag(" + tag + "," + tagLibrary + ")", "http result:");
                $log.debug("updateTag(" + tag + "," + tagLibrary + ")", result.data);
                result.data.forEach(function (returnedData) {
                    $rootScope.tagList[tagLibrary].tags[tag] = returnedData.value;
                    updateTagLibraryVersion(tagLibrary, returnedData.lastModified);
                });
            } else {
                $log.error("updateTag(" + tag + "," + tagLibrary + ")", "http error log:");
                $log.error("updateTag(" + tag + "," + tagLibrary + ")", result.statusText);
            }
        });
    }

    function updateTagLibraryVersion(tagLibrary, version) {
        $rootScope.tagList[tagLibrary].version = version;
        store(_lsTagList, $rootScope.tagList);
    }

    return {
        initiateAngularTagger: initiateAngularTagger,
        setListUrl: setListUrl,
        setCurrentTagLibrary: setCurrentTagLibrary,
        addTagLibrary: addTagLibrary,
        addTagToTagList: addTagToTagList,
        doesTagLibraryExist: doesTagLibraryExist,
        doesTagExist: doesTagExist,
        addTagToTagLibrary: addTagToTagLibrary,
        updateTag: updateTag,
        updateTagLibraryVersion: updateTagLibraryVersion
    };

    function startLocalStorage() {
        $log.debug("Start LocalStorage", "");
        if(!angular.isObject(store(_lsTagList))) {
            $log.debug("Start LocalStorage", "store(_lsTagList) is empty");
            store(_lsTagList, {});
        }
        $rootScope.tagList = store(_lsTagList);
    }
}).directive('tagger', function (angularTaggerService, $log) {
    return {
        scope: {
            tagList: '=',
            currentLibrary: '='
        },
        template: '{{tagList[currentLibrary].tags[tag]}}',
        link: function ($scope, element) {
            $scope.tag = element.attr('tagger');

            if ($scope.tag == '') {
                return false;
            }
            function createDirective() {
                $log.debug("createDirective", "Tagger Directive tag: " + $scope.tag);
                angularTaggerService.addTagToTagList($scope.tag);
            }

            $scope.$watch('tagList', function () {
                createDirective();
            });
            $scope.$watch('currentLibrary', function () {
                createDirective();
            });
        }
    }
});