(function () {
    var settings = allure.getPluginSettings('json-diff', { diffType: 'diff' });

    function get(url, callback) {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", 'data/attachments/' + url, true);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.onload = function () {
            let response = JSON.parse(xhr.responseText);
            callback(response);
        };
        xhr.send();
    }

    function setJsonDiffContent(actual, expected) {
        get(actual, (actualJson)=> {
            get(expected, (expectedJson)=> {
                //console.log('Actual:' + actualJson);
                //console.log('Expected:' + expectedJson);
                var delta = jsondiffpatch.diff(actualJson, expectedJson);
                jsondiffpatch.formatters.html.hideUnchanged();
                document.getElementById('jsonDiffContent').innerHTML = jsondiffpatch.formatters.html.format(delta, expectedJson);
            })
        })
    }

    function setHiddenInputs(data) {
        //console.log(data);
        function findJson(name) {
            const attachments = [];

            if (data.testStage && data.testStage.attachments) {
                data.testStage.attachments.forEach(attachment => {
                    attachments.push(attachment);
                });
            }
            if (data.testStage && data.testStage.steps) {
                data.testStage.steps.forEach(step => {
                    if (step && step.attachments) {
                        step.attachments.forEach(attachment => {
                            attachments.push(attachment);
                        });
                    }
                });
            }
            return attachments
                .filter(attachment => attachment.name === name)[0]
        }

        var actualJson = findJson('Actual JSON');
        var expectedJson = findJson('Expected JSON');

        if (!actualJson && !expectedJson) {
            return '<span>Actual and expected JSON have not been provided.</span>';
        }

        return '<input id="allure-actual-json" name="actual-json" type="hidden" value="' + actualJson.source + '">' +
            '<input id="allure-expected-json" name="expected-json" type="hidden" value="' + expectedJson.source + '">'
    }

    var JsonDiffView = Backbone.Marionette.View.extend({
        className: 'pane__section',
        events: {
            'click [id="show-unchanged"]': 'onShowUnchanged',
            'click [id="load-json-diff"]': 'onLoadDiffButtonClick'
        },
        templateContext: function () {
            return {
                diffType: settings.get('diffType')
            }
        },
        template: function (data) {
            var testType = data.labels.filter(function (label) {
                return label.name === 'testType'
            })[0];

            if (!testType || testType.value !== 'jsonDiff') {
                return '';
            }

            return '<h3 class="pane__section-title">JSON diff</h3>' +
                '<div class="json-diff__content">' +
                '<input type="button" id="load-json-diff" value="Load diff">' +
                '<div class="json-diff__switchers">' +
                '<label><input type="checkbox" id="show-unchanged"> Show unchanged values</label>' +
                '</div>'+
                setHiddenInputs(data) +
                '<div id="jsonDiffContent"></div>';
        },
        onShowUnchanged: function (event) {
            if (document.getElementById("show-unchanged").checked) {
                jsondiffpatch.formatters.html.showUnchanged();
            }
            else {
                jsondiffpatch.formatters.html.hideUnchanged();
            }
        },
        onLoadDiffButtonClick: function (event) {
            var actualJson = document.getElementById("allure-actual-json").value;
            var expectedJson = document.getElementById("allure-expected-json").value;
            setJsonDiffContent(actualJson, expectedJson);
        }
    });
    allure.api.addTestResultBlock(JsonDiffView, { position: 'before' });
})();
