
;; title: counter
;; version:
;; summary:
;; description:

;; traits
;;

;; token definitions
;;

;; constants
;;

;; data vars
;;

;; data maps
(define-map counters principal uint)


;; public functions
(define-public (count-up)
    (ok (map-set counters tx-sender (+ (get-count ) u1)))
)

;; read only functions
(define-read-only (get-count)
    (default-to u0 (map-get? counters tx-sender))
)

;; private functions
;;

