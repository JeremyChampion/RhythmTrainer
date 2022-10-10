var goodies = goodies || new function () {

    this.require = function (url, success) {

        if (document.querySelector(`script[src="${url}"]`).length) {

            if (success) {
                success();
            }

        }
        else {

            let script = document.createElement('script');

            script.onload = function () {

                if (success) {
                    success();
                }

            };

            script.src = url;

            document.head.appendChild(script);

        }

    }

};